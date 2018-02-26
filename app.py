#system modules
import datetime

#external modules
from flask import Flask, render_template,request, jsonify, redirect, url_for
from pymongo import MongoClient
from bson import ObjectId

# my modules
from configuration import configuration
from social_smart_meter import SocialSmartMeter

app = Flask(__name__)
client = MongoClient(
    configuration.DB_HOST, configuration.DB_PORT)

db = client[configuration.DB_NAME]

ssm = SocialSmartMeter(db)

@app.route('/')
def contacts():
    return render_template('index.html', title='Social Smart Meter')


@app.route('/area')
def get_area():
    name = configuration.AREA
    area = db["area"].find_one({"name":name})
    return jsonify(area["geojson"])


@app.route('/get_tweet_count')
def get_tweet_count():

    start = int(request.args["start"])
    end = int(request.args["end"])

    start_date = datetime.datetime.fromtimestamp(start//1000)
    end_date = datetime.datetime.fromtimestamp(end//1000)

    start_month = start_date.month
    start_day = start_date.day

    end_month = end_date.month
    end_day = end_date.day

    data = ssm.get_tweet_count(start_month,end_month,start_day,end_day,0,23)
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
    app.run(debug=True)
