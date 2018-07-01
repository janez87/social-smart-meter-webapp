#system modules
import datetime

#external modules
from flask import Flask, render_template,request, jsonify, redirect, url_for
from pymongo import MongoClient
from bson import ObjectId
from flask_socketio import SocketIO, emit

# my modules
from configuration import configuration
from social_smart_meter import SocialSmartMeter
from annotator.annotator import Annotator

app = Flask(__name__)
app.debug = True
socketio = SocketIO(app, async_mode='eventlet')

client = MongoClient(
    configuration.DB_HOST, configuration.DB_PORT)

db = client[configuration.DB_NAME]

ssm = SocialSmartMeter(db)

# Views rendering
@app.route('/')
def index():

    city = configuration.AREA

    centroid = db["area"].find_one({"name":city})["centroid"]

    return render_template('index.html', title='Social Smart Meter', city=city, centroid=centroid)


@app.route('/specific')
def specific():

    if "category" not in request.args:
        return redirect(url_for("index"))

    city = configuration.AREA
    centroid = db["area"].find_one({"name":city})["centroid"]

    category = request.args["category"]

    return render_template('specific_energy.html',category=category, city=city, centroid=centroid)

# SocketIO notification
@socketio.on('tweet')
def send_tweet(data):
    emit("tweet",data,broadcast=True)

@socketio.on('client_connected')
def on_connect():
    print("Someone connected")

@socketio.on_error()
def on_error(e):
    print(e)

# AJAX response
@app.route('/tweets')
def get_tweets():
    start = int(request.args["start"])
    end = int(request.args["end"])
    category = None

    if "category" in request.args:
        category = request.args["category"]

    start_date = datetime.datetime.fromtimestamp(start // 1000)
    end_date = datetime.datetime.fromtimestamp(end // 1000)

    data = ssm.get_tweets(start_date, end_date, category)
    return jsonify(data)

@app.route('/area')
def get_area():
    name = configuration.AREA
    area = db["area"].find_one({"name":name})
    return jsonify(area["geojson"])

@app.route('/displacement')
def get_user_displacement():
    start = int(request.args["start"])
    end = int(request.args["end"])

    start_date = datetime.datetime.fromtimestamp(start // 1000)
    end_date = datetime.datetime.fromtimestamp(end // 1000)

    data = ssm.get_user_displacement(start_date, end_date)
    return jsonify(data)


@app.route('/get_geo_tweet_count')
def get_tweet_count():

    start = int(request.args["start"])
    end = int(request.args["end"])
    category = None

    if "category" in request.args:
        category = request.args["category"]

    start_date = datetime.datetime.fromtimestamp(start//1000)
    end_date = datetime.datetime.fromtimestamp(end//1000)

    data = ssm.get_tweet_count(start_date,end_date, category)
    return jsonify(data)


@app.route('/get_words_count')
def get_words_count():
    start = int(request.args["start"])
    end = int(request.args["end"])
    category = request.args["category"]

    start_date = datetime.datetime.fromtimestamp(start // 1000)
    end_date = datetime.datetime.fromtimestamp(end // 1000)
    count = ssm.get_words_count(start_date,end_date,category)

    return jsonify(count)


@app.route('/get_tweets')
def get_raw_tweets():
    start = int(request.args["start"])
    end = int(request.args["end"])
    
    if "category" in request.args:
        category = request.args["category"]
    else:
        category = None

    if "area_name" in request.args:
        area_name = request.args["area_name"]
    else:
        area_name = None

    start_date = datetime.datetime.fromtimestamp(start // 1000)
    end_date = datetime.datetime.fromtimestamp(end // 1000)

    data = ssm.get_labeled_tweets(start_date,end_date,category,area_name)

    return jsonify(data)

# Offline method
@app.route('/annotate')
def annotate_tweets():
    ssm.annotate_tweets_location()
    return jsonify({"status":"ok"})




# Custom methods for the evaluating the cassifier
@app.route('/tweet_evaluation')
def get_tweet_to_evaluate():
    db = client["twitter"]
    collection = db["tweet"]
    query = {
        "crowd_evaluation":{
            "$exists":False
        },
        "relevant":{
            "$exists":True
        }
    }

    tweet = collection.find_one(query)

    return render_template('tweet_evaluation.html',tweet=tweet)


@app.route('/evaluate', methods=['POST'])
def evaluate():
    evaluation = bool(int(request.form["relevant"]))
    tweet_id = request.form["id"]

    db = client["twitter"]
    collection = db["tweet"]
    
    query = {
        "_id": ObjectId(tweet_id)
    }

    update = {
        "$set":{
            "crowd_evaluation":evaluation
        }
    }
    
    collection.update(query,update)

    return redirect(url_for("get_tweet_to_evaluate"))


if __name__ == '__main__':
    #app.run(debug=True)
    socketio.run(app,port=configuration.SOCKETIO_PORT)
