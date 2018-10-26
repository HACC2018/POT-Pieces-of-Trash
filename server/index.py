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

client = MongoClient()
db = client['waste_audit']
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
        image.save(path)
        result = trash_analysis(path)

        result['location'] = request.form['location']
        result['timestamp'] = int(time.mktime(datetime.datetime.now().timetuple()))
        result['image'] = path

        result_collection.insert_one(result)
        result['id'] = str(result['_id'])

        del result['_id']

        return jsonify({'ok': True, 'result': result}), 200
    else:
        return jsonify({'ok': False,
                        'message': 'image file does not have an extension of either jpg, jpeg, or png '
                                   '(case insensitive)'}), \
               400


@app.route('/query')
def query_data():
    from_time = None
    if 'from' in request.args:
        from_time = int(request.args.get('from'))

    to_time = None
    if 'to' in request.args:
        to_time = int(request.args.get('to'))

    time_query = {}
    if from_time:
        time_query['timestamp'] = {}
        time_query['timestamp']['$gte'] = from_time

    if to_time:
        if 'timestamp' not in time_query:
            time_query['timestamp'] = {}
        time_query['timestamp']['$lte'] = to_time

    location = None
    if 'location' in request.args:
        location = request.args.get('location')

    query_filter = {}
    if time_query:
        query_filter = {**query_filter, **time_query}

    if location:
        query_filter = {**query_filter, **{'location': location}}

    entries = result_collection.find(query_filter, {'_id': False}).sort('timestamp', pymongo.ASCENDING)
    return jsonify({'ok': True, 'data': list(entries)}), 200


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


@app.route('/<path:path>')
def serve_static_file(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    app.run()
