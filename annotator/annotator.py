# System modules
import datetime

# External modules
from shapely.geometry import shape, Point

# My modules
from classifier.classifier import Classifier
from configuration import configuration

class Annotator:

    def __init__(self, db):
        self.db = db

        self.city = self.db["area"].find_one({
            "name": configuration.AREA
        })

        self.classifier = Classifier()

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