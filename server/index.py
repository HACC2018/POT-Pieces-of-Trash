import os

import datetime
import uuid
import time

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

@app.route('/')
def hello():
    return "Hello World"


@app.route("/ping")
def ping():
    return jsonify({'ok': True})


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}


@app.route("/analyze", methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'ok': False, 'message': "The name 'image' is not found in the file upload input field"}), 400

    image = request.files['image']
    if image.filename == '':
        return jsonify({'ok': False, 'message': 'No selected file'}), 400

    if request.form['location'] == '':
        return jsonify({'ok': False, 'message': 'The field "location" is not filled'}), 400

    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        extension = os.path.basename(filename).split('.')[-1]
        filename = str(uuid.uuid4()) + '.' + extension

        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        image.save(path)
        wastes = trash_analysis(path)

        result = {'location': request.form['location'],
                  'timestamp': int(time.mktime(datetime.datetime.now().timetuple())),
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
        query_filter = {**query_filter, **{'location': {'$in': location}}}

    entries = result_collection.find(query_filter, {'_id': False}).sort('timestamp', pymongo.ASCENDING)
    return entries


def get_lowerbound_timestamp(epoch):
    return int(time.mktime(datetime.date.fromtimestamp(epoch).timetuple()))


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
        upperbound_time = time.mktime((datetime.date.fromtimestamp(timestamp) + datetime.timedelta(days=1)).timetuple())

        entries = query_data(lowerbound_time, upperbound_time, location)
        wastes = {}
        for entry in entries:
            for item in entry['wastes']:
                if item not in wastes:
                    wastes[item] = 0
                wastes[item] += entry['wastes'][item]

        return jsonify({'wastes': wastes, 'timestamp': lowerbound_time, 'location': location, 'unit': 'lb'}), 200
    else:
        all_entries = result_collection.find({}, projection={'timestamp': True, 'location': True})
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


@app.route('/timeseries', methods=['POST'])
def time_series():
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
    upperbound = time.mktime((datetime.date.fromtimestamp(int(upperbound)) + datetime.timedelta(days=1)).timetuple())

    entries = query_data(lowerbound, upperbound, requested_locations)

    is_all_locations = False
    if isinstance(requested_locations, str):
        if requested_locations.lower() == 'all':
            is_all_locations = True
        requested_locations = {requested_locations}
    else:
        requested_locations = set(requested_locations)

    is_all_wastes = False
    if isinstance(waste_types, str):
        if waste_types.lower() == 'all':
            is_all_wastes = True
            waste_types = {waste_types}
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

    result = {'x': x, 'y': y}
    for entry in entries:
        if not is_all_locations:
            if entry['location'] not in requested_locations:
                continue
            else:
                entry_location = entry['location']
        else:
            entry_location = 'All'

        for entry_waste in entry['wastes']:
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

    return jsonify(result), 200


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

            return jsonify({'ok': True, 'data': document}), 200
    elif request.method == 'GET':
        return jsonify({'data': list(location_collection.find({}, {'_id': False}))}), 200


@app.route('/actions', methods=['GET', 'POST'])
def actions_items():
    if request.method == 'GET':
        location_query = {}
        if 'location' in request.args:
            location_query = {'location': request.args.get('location')}

    elif request.method == 'POST':
        pass


@app.route('/waste-types')
def get_waste_types():
    return jsonify({'waste-types:': ['starbucks', 'paper cups', 'straws', 'forks', 'knifes', 'paper', 'cans']}), 200

@app.route('/static/<path:path>')
def serve_static_file(path):
    return send_from_directory('static', path)


if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    app.run()
