import os

import datetime
import uuid
import time

from bson import ObjectId

import trash_counter
import pickle

import pymongo
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.utils import secure_filename

from image_analysis import trash_analysis

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'static/data/images'

mongodb_uri = os.getenv('MONGODB_URI', None)
db_name = os.getenv('DATABASE_NAME', 'waste_audit')

if mongodb_uri:
    client = MongoClient(mongodb_uri)
else:
    client = MongoClient()

db = client[db_name]
result_collection = db['audit_results']
location_collection = db['locations']
action_collection = db['actions']


def train_model(analyer, features="data/features.pkl", labels="data/labels.txt"):
    labels = [line.strip() for line in open(labels, encoding="ascii") if line.strip()]
    features = pickle.load(open(features, "rb"))
    analyer.classifier.fit(features, labels)


analyzer = trash_counter.TrashCounter()
train_model(analyzer)


@app.route('/')
def hello():
    return send_from_directory('.', 'index.html')


@app.route("/ping")
def ping():
    return jsonify({'ok': True})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}


def classify_waste(image_path):
    results = analyzer(image_path, image_dir='static/image_chips')
    labels_count = {}
    for result in results:
        if result['label'] not in labels_count:
            labels_count[result['label']] = 0
        labels_count[result['label']] += 1

    return {'wastes': labels_count, 'image_chips': results}


@app.route("/analyze", methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'ok': False, 'message': "The name 'image' is not found in the file upload input field"}), 400

    image = request.files['image']
    if image.filename == '':
        return jsonify({'ok': False, 'message': 'No selected file'}), 400

    if 'location' not in request.form or request.form['location'] == '':
        return jsonify({'ok': False, 'message': 'The field "location" is not filled'}), 400

    if 'timestamp' in request.form:
        timestamp = int(request.form['timestamp'])
    else:
        timestamp = int(time.mktime(datetime.datetime.now().timetuple()))

    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        extension = os.path.basename(filename).split('.')[-1]
        filename = str(uuid.uuid4()) + '.' + extension

        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        image.save(path)

        if True:
            wastes = classify_waste(path)
            result = {'location': request.form['location'],
                      'timestamp': timestamp,
                      'image': path,
                      'wastes': wastes['wastes'],
                      'image_chips': wastes['image_chips']}
        else:
            wastes = trash_analysis(path)
            result = {'location': request.form['location'],
                      'timestamp': timestamp,
                      'image': path,
                      'wastes': wastes}

        result_collection.insert_one(result)
        result['id'] = str(result['_id'])

        del result['_id']

        return jsonify({'ok': True, 'result': result}), 200
    else:
        return jsonify({'ok': False,
                        'message': 'image file does not have an extension of either jpg, jpeg, or png '
                                   '(case insensitive)'}), \
               400


def query_data(from_time, to_time, location):
    time_query = {}
    if from_time:
        time_query['timestamp'] = {}
        time_query['timestamp']['$gte'] = from_time

    if to_time:
        if 'timestamp' not in time_query:
            time_query['timestamp'] = {}
        time_query['timestamp']['$lt'] = to_time

    query_filter = {}
    if time_query:
        query_filter = {**query_filter, **time_query}

    if isinstance(location, str):
        if location.lower() != 'all':
            query_filter = {**query_filter, **{'location': location}}
    elif isinstance(location, list):
        if 'all' not in set(i.lower() for i in location):
            query_filter = {**query_filter, **{'location': {'$in': location}}}

    entries = result_collection.find(query_filter, {'_id': False}).sort('timestamp', pymongo.ASCENDING)
    return entries


def get_lowerbound_timestamp(epoch):
    return int(time.mktime(datetime.date.fromtimestamp(epoch).timetuple()))


@app.route('/results', methods=['GET'])
def get_results():
    all_data = query_data(0, int(time.mktime(datetime.datetime.now().timetuple())) + 60 * 60 * 24, 'all')
    all_data = list(all_data)
    all_data.reverse()
    return jsonify(all_data), 200


@app.route('/pie', methods=['POST', 'GET'])
def pie_chart():
    if request.method == 'POST':
        if 'location' not in request.get_json():
            return jsonify({'ok': False, 'message': "'location' is expected in the body of the json"}), 400

        if 'timestamp' not in request.get_json():
            return jsonify({'ok': False, 'message': "'time' is expected in the body of the json"}), 400

        location = str(request.get_json()['location'])
        timestamp = int(request.get_json()['timestamp'])
        lowerbound_time = get_lowerbound_timestamp(timestamp)
        upperbound_time = get_lowerbound_timestamp(timestamp + 86400)

        entries = query_data(lowerbound_time, upperbound_time, location)
        wastes = {}
        for entry in entries:
            for item in entry['wastes']:
                if item not in wastes:
                    wastes[item] = 0
                wastes[item] += entry['wastes'][item]

        return jsonify({'wastes': wastes, 'timestamp': lowerbound_time, 'location': location, 'unit': 'lb'}), 200
    else:
        all_entries = result_collection.find({}, projection={'timestamp': True, 'location': True}).sort('timestamp',
                                                                                                        pymongo.DESCENDING)
        options = {}
        for entry in all_entries:
            timestamp = entry['timestamp']
            start_of_day = get_lowerbound_timestamp(timestamp)
            if start_of_day not in options:
                options[start_of_day] = set()
            options[start_of_day].add(entry['location'])

        available_dates = []
        for date in options:
            available_dates.append({'date': date, 'locations': list(options[date])})

        return jsonify(available_dates), 200


@app.route('/timeseries', methods=['GET', 'POST'])
def time_series():
    if request.method == 'POST':
        request_json = request.get_json()

        if 'lowerbound' not in request_json:
            return jsonify({'ok': False, 'message': "'lowerbound' is expected in the body of the json"}), 400

        if 'upperbound' not in request_json:
            return jsonify({'ok': False, 'message': "'upperbound' is expected in the body of the json"}), 400

        if 'waste-types' not in request_json:
            return jsonify({'ok': False, 'message': "'waste-type' is expected in the body of the json"}), 400

        if 'location' not in request_json:
            return jsonify({'ok': False, 'message': "'location' is expected in the body of the json"}), 400

        lowerbound = request_json['lowerbound']
        upperbound = request_json['upperbound']
        waste_types = request_json['waste-types']
        requested_locations = request_json['location']

        lowerbound = get_lowerbound_timestamp(int(lowerbound))
        upperbound = get_lowerbound_timestamp(int(upperbound) + 86400)

        entries = query_data(lowerbound, upperbound, requested_locations)

        is_all_locations = False
        if isinstance(requested_locations, str):
            if requested_locations.lower() == 'all':
                is_all_locations = True
            requested_locations = {requested_locations}
        else:
            if 'all' in set(i.lower() for i in requested_locations):
                is_all_locations = True
            else:
                requested_locations = set(requested_locations)

        is_all_wastes = False
        if isinstance(waste_types, str):
            if waste_types.lower() == 'all':
                is_all_wastes = True
            waste_types = {waste_types}
        else:
            if 'all' in set(i.lower() for i in waste_types):
                is_all_wastes = True
            else:
                waste_types = set(waste_types)

        x = set()
        entries = list(entries)
        for entry in entries:
            lowerbound = get_lowerbound_timestamp(entry['timestamp'])
            if lowerbound not in x:
                x.add(lowerbound)

        x = list(x)
        x.sort()

        y = []
        unique_records = {}

        result = {'x': x, 'y': y, 'avail-wastes': set(), 'avail-locations': set()}
        for entry in entries:
            result['avail-locations'].add(entry['location'])
            if not is_all_locations:
                if entry['location'] not in requested_locations:
                    continue
                else:
                    entry_location = entry['location']
            else:
                entry_location = 'All'

            for entry_waste in entry['wastes']:
                result['avail-wastes'].add(entry_waste)
                if not is_all_wastes:
                    if entry_waste not in waste_types:
                        continue
                    else:
                        waste = entry_waste
                else:
                    waste = 'all'

                unique_record = (waste, entry_location)
                if unique_record not in unique_records:
                    unique_records[unique_record] = len(y)
                    y.append({'waste': waste, 'data': [''] * len(x), 'location': entry_location})

                waste_data = y[unique_records[unique_record]]['data']
                lowerbound = get_lowerbound_timestamp(entry['timestamp'])
                x_index = x.index(lowerbound)

                saved_amount = waste_data[x_index]
                if saved_amount != '':
                    waste_data[x_index] = entry['wastes'][entry_waste] + saved_amount
                else:
                    waste_data[x_index] = entry['wastes'][entry_waste]

        result['avail-locations'] = list(result['avail-locations'])
        result['avail-wastes'] = list(result['avail-wastes'])
        return jsonify(result), 200

    elif request.method == 'GET':
        all_data = query_data(0, int(time.mktime(datetime.datetime.now().timetuple())) + 60 * 60 * 24, 'all')
        dates = set()
        for entry in all_data:
            dates.add(get_lowerbound_timestamp(entry['timestamp']))
        dates = list(dates)
        dates.sort()
        return jsonify(dates), 200


@app.route('/locations', methods=['GET', 'POST'])
def locations():
    if request.method == 'POST':
        if 'location' not in request.get_json():
            return jsonify({'ok': False, 'message': "'location' is expected in the body of the json"}), 400
        else:
            location = request.get_json()['location']
            document = {'location': location}
            if location_collection.find(document).count() == 0:
                location_collection.insert_one(dict(document))

            if action_collection.find(document).count() == 0:
                action_document = {'location': location, 'action': 'Start auditing waste.',
                                   'timestamp': int(time.mktime(datetime.datetime.now().timetuple())),
                                   'completed': False}
                action_collection.insert_one(dict(action_document))

            return jsonify({'ok': True, 'data': document}), 200
    elif request.method == 'GET':
        return jsonify({'data': list(location_collection.find({}, {'_id': False}))}), 200


@app.route('/actions', methods=['GET', 'POST', 'PUT'])
def actions_items():
    if request.method == 'GET':
        actions = action_collection.find().sort('timestamp', pymongo.DESCENDING)
        location_actions = {}
        for action in actions:
            if action['location'] not in location_actions:
                location_actions[action['location']] = []
            location_actions[action['location']].append(
                {'action': action['action'], 'timestamp': action['timestamp'], 'completed': action['completed'],
                 'id': str(action['_id'])})

        return jsonify(**location_actions)
    elif request.method == 'POST':
        if 'location' not in request.get_json():
            return jsonify({'ok': False, 'message': "'location' is expected in the body of the json"}), 400

        if 'action' not in request.get_json():
            return jsonify({'ok': False, 'message': "'action' is expected in the body of the json"}), 400

        location = request.get_json()['location']
        action = request.get_json()['action']
        if 'timestamp' in request.get_json():
            timestamp = int(request.get_json()['timestamp'])
        else:
            timestamp = int(time.mktime(datetime.datetime.now().timetuple()))

        document = {'location': location, 'action': action, 'timestamp': timestamp, 'completed': False}
        action_collection.insert_one(document)
        document['id'] = str(document['_id'])
        del document['_id']
        return jsonify({'ok': True, 'data': document}), 200

    elif request.method == 'PUT':
        if 'id' not in request.get_json():
            return jsonify({'ok': False, 'message': "'id' is expected in the body of the json"}), 400

        action = action_collection.find_one({'_id': ObjectId(request.get_json()['id'])})
        if action:
            action_collection.update_one({'_id': ObjectId(request.get_json()['id'])},
                                         {'$set': {'completed': not action['completed']}})
            return jsonify({'ok': True}), 200
        return jsonify({'ok': False, 'message': '{} cannot be found'.format(request.get_json()['id'])}), 400


@app.route('/waste-types')
def get_waste_types():
    return jsonify({'waste-types:': ['starbucks', 'paper cups', 'straws', 'forks', 'knifes', 'paper', 'cans']}), 200


@app.route('/ranking')
def get_rankings():
    all_data = query_data(0, int(time.mktime(datetime.datetime.now().timetuple())) + 60 * 60 * 24, 'all')
    location_data = {}
    for data in all_data:
        if data['location'] not in location_data:
            location_data[data['location']] = []

        waste_data = data['wastes']
        total_waste = 0
        for waste in waste_data:
            total_waste += waste_data[waste]

        location_data[data['location']].append(total_waste)

    location_rank = []
    for location in location_data:
        if len(location_data[location]) == 1:
            location_rank.append({'location': location, 'change': 1})
        else:
            change_sum = 0
            for ii in range(len(location_data[location]) - 1):
                change_sum += location_data[location][ii + 1] / float(location_data[location][ii])
            location_rank.append({'location': location, 'change': float(change_sum) / len(location_data[location])})

    location_rank.sort(key=lambda el: el['change'])
    return jsonify(location_rank), 200


@app.route('/static/<path:path>')
def serve_static_file(path):
    return send_from_directory('static', path)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if os.path.isfile(path):
        return send_from_directory('.', path)
    else:
        return '', 404


if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    app.run()
