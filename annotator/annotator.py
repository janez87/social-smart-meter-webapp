# System modules
import datetime
import re
import sys

# External modules
from shapely.geometry import shape, Point
from gensim import utils
from stop_words import get_stop_words

# My modules
sys.path.append('..')

from classifier.classifier import Classifier
from configuration import configuration


class Annotator:

    def __init__(self, db):
        self.db = db

        self.city = self.db["area"].find_one({
            "name": configuration.AREA
        })

        self.classifier = Classifier(self.db)


    def tokenize(self,tweet):
        stop_words_list = get_stop_words("en")

        tweet_text = tweet["text"]

        if tweet["truncated"]:
            tweet_text = tweet["extended_tweet"]["full_text"]

        tweet_text = re.sub(r"(?:\@|https?\://)\S+", "", tweet_text)

        tokens = [token for token in utils.simple_preprocess(
            tweet_text, deacc=False, min_len=3) if token not in stop_words_list]

        tweet["tokens"] = tokens

        return tweet

    def add_date(self,tweet):
        tweet["date"] = datetime.datetime.fromtimestamp(int(tweet["timestamp_ms"]) // 1000)
        return tweet

    def annotate_tweet_location(self, tweet):

        if tweet["geo"] is None and tweet["place"] is None:
            return tweet

        point = None
        if tweet["geo"] is not None:
            point = Point(tweet["geo"]["coordinates"][1], tweet["geo"]["coordinates"][0])

        for a in self.city["geojson"]["features"]:
            area = shape(a["geometry"])
            if (point is not None and area.contains(point)) or a["properties"]["name"] == tweet["place"]["name"]:
                tweet["area_name"] = a["properties"]["name"]
                #tweet["area_id"] = a["id"]
                print("Found a tweet in",tweet["area_name"])
                break

        return tweet

    def classify_tweet(self, tweet):
        return self.classifier.classify(tweet)


    def classify_offline(self):
        tweets = list(self.db["tweet"].find())

        print("Classifying tweets")
        for t in tweets:
            print(t["id"])
            c_tweet = self.classifier.classify(t)
            self.db["tweet"].update({"id": t["id"]}, {"$set": {"categories": c_tweet["categories"]}})

        print("Done")

    def tokenize_offline(self):
        tweets = list(self.db["tweet"].find())

        print("Updating tweets")
        for t in tweets:
            stop_words_list = get_stop_words("en")

            tweet_text = t["text"]

            if t["truncated"]:
                tweet_text = t["extended_tweet"]["full_text"]

            tweet_text = re.sub(r"(?:\@|https?\://)\S+", "", tweet_text)

            tokens = [token for token in utils.simple_preprocess(
                tweet_text, deacc=False, min_len=3) if token not in stop_words_list]

            query = {
                "_id": t["_id"]
            }

            update = {
                "$set": {
                    "tokens": tokens
                }
            }
            self.db["tweet"].update(query, update)

        print("Done")


if __name__ == "__main__":
    from pymongo import MongoClient

    client = MongoClient(
        configuration.DB_HOST, configuration.DB_PORT)

    db = client[configuration.DB_NAME]

    annotator = Annotator(db)

    annotator.classify_offline()