# system modules
import sys

# external modules
import tweepy
from pymongo import MongoClient

# my modules
sys.path.append("../")
from configuration import configuration as config
from social_smart_meter import SocialSmartMeter

BOUNDING_BOX = [4.736851, 52.273948, 5.065755, 52.430806]  # Amsterdam


# BOUNDING_BOX = [28.4480, 40.8027, 29.4579, 41.2360] # Istanbul

class StreamCrawler(tweepy.StreamListener):

    def __init__(self, collection,ssm):
        tweepy.StreamListener.__init__(self)
        self.collection = collection
        self.ssm = ssm

    def on_status(self, tweet):
        print(tweet.text)
        tweet = self.ssm.annotate_tweet_location(tweet)
        self.save_tweets(tweet)

    def on_error(self, status_code):
        print(status_code)
        return True

    def save_tweets(self, tweet):
        self.collection.insert(tweet._json)


def main():
    print("Connecting to Mongo")
    client = MongoClient(config.DB_HOST, config.DB_PORT)
    db = client[config.DB_NAME]

    ssm = SocialSmartMeter(db)

    twitterCollection = db["tweet"]

    print("Authenticating")
    auth = tweepy.OAuthHandler(config.CONSUMER_KEY, config.CONSUMER_SECRET)
    auth.set_access_token(config.ACCESS_TOKEN, config.ACCESS_TOKEN_SECRET)
    api = tweepy.API(auth)

    print("Creating the stream")
    stream_listener = StreamCrawler(twitterCollection,ssm)
    stream = tweepy.Stream(auth=api.auth, listener=stream_listener)

    print("Starting the stream")
    stream.filter(locations=BOUNDING_BOX, async=True)


if __name__ == "__main__":
    main()
