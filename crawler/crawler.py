# system modules
import sys

# external modules
import tweepy
from pymongo import MongoClient
from socketIO_client import SocketIO

# my modules
sys.path.append("../")
from configuration import configuration as config
from annotator.annotator import Annotator

#BOUNDING_BOX = [4.736851, 52.273948, 5.065755, 52.430806]  # Amsterdam
BOUNDING_BOX = [ -71.191421, 42.227797, -70.986004, 42.399542]  # Boston


# BOUNDING_BOX = [28.4480, 40.8027, 29.4579, 41.2360] # Istanbul

class StreamCrawler(tweepy.StreamListener):

    def __init__(self, collection,annotator):
        tweepy.StreamListener.__init__(self)
        self.collection = collection
        self.annotator = annotator
        self.socket_io = SocketIO(config.SOCKETIO_HOST, config.SOCKETIO_PORT)

    def on_status(self, tweet):
        print(tweet.text)

        json_tweet = tweet._json
        json_tweet = self.annotator.add_date(json_tweet)
        json_tweet = self.annotator.annotate_tweet_location(json_tweet)
        json_tweet = self.annotator.classify_tweet(json_tweet)
        json_tweet = self.annotator.tokenize(json_tweet)

        self.save_tweets(json_tweet)

        # Object ID and datetime are not json serializable
        json_tweet["_id"] = str(json_tweet["_id"])
        json_tweet["date"] = json_tweet["date"].isoformat()

        self.socket_io.emit("tweet", json_tweet)

    def on_error(self, status_code):
        print("An error occurred while listening to the stream ->", status_code)
        return True

    def save_tweets(self, tweet):
        self.collection.insert(tweet)


def main():
    print("Connecting to Mongo")
    client = MongoClient(config.DB_HOST, config.DB_PORT)
    db = client[config.DB_NAME]

    annotator = Annotator(db)

    twitter_collection = db["tweet"]

    print("Authenticating")
    auth = tweepy.OAuthHandler(config.CONSUMER_KEY, config.CONSUMER_SECRET)
    auth.set_access_token(config.ACCESS_TOKEN, config.ACCESS_TOKEN_SECRET)
    api = tweepy.API(auth)

    print("Creating the stream")
    stream_listener = StreamCrawler(twitter_collection,annotator)
    stream = tweepy.Stream(auth=api.auth, listener=stream_listener)

    print("Starting the stream")
    stream.filter(locations=BOUNDING_BOX, async=True)


if __name__ == "__main__":
    main()
