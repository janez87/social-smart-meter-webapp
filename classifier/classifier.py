import sys

from gensim import models
from sklearn.externals import joblib

from pymongo import MongoClient
from sklearn import svm
from sklearn.preprocessing import normalize
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import HashingVectorizer
from scipy.sparse import vstack, csr_matrix
import numpy as np

sys.path.append("../")
from configuration import configuration as config


class Classifier:

    def __init__(self, db):

        self.tweet_model = models.Doc2Vec.load('../' + config.CLASSIFIER_PATH + config.TWEET_MODEL)
        self.food_classifier = joblib.load('../'+config.CLASSIFIER_PATH+config.FOOD_CLASSIFIER)
        self.leisure_classifier = joblib.load('../'+config.CLASSIFIER_PATH+config.LEISURE_CLASSIFIER)
        self.mobility_classifier = joblib.load('../'+config.CLASSIFIER_PATH+config.MOBILITY_CLASSIFIER)
        self.dwelling_classifier = joblib.load('../'+config.CLASSIFIER_PATH+config.DWELLING_CLASSIFIER)

        self.db = db

        self.blacklist = ["hiring", "hire", "job"]

        self._load_dictionaries()

    def _load_dictionaries(self):

        self.food_terms = list(map(lambda x: x["word"],list(self.db["dictionary_food"].find())))
        self.leisure_terms = list(map(lambda x: x["word"],list(self.db["dictionary_leisure"].find())))
        self.mobility_terms = list(map(lambda x: x["word"],list(self.db["dictionary_mobility"].find())))
        self.dwelling_terms = list(map(lambda x: x["word"],list(self.db["dictionary_dwelling"].find())))

    def classify(self,tweet):

        categories = []

        tweet["categories"] = categories

        if len(set(tweet["tokens"]) & set(self.blacklist))>0:
            return tweet

        tweet_vector = self.tweet_model.infer_vector(tweet["tokens"])

        food_common = set(tweet["tokens"]) & set(self.food_terms)
        if self.food_classifier.predict(tweet_vector.reshape(1,-1)) or len(food_common)>0:
            categories.append("FOOD")

        leisure_common = set(tweet["tokens"]) & set(self.leisure_terms)
        if self.leisure_classifier.predict(tweet_vector.reshape(1,-1)) or len(leisure_common)>0:
            categories.append("LEISURE")

        mobility_common = set(tweet["tokens"]) & set(self.mobility_terms)
        if self.mobility_classifier.predict(tweet_vector.reshape(1,-1)) or len(mobility_common)>0:
            categories.append("MOBILITY")

        dwelling_common = set(tweet["tokens"]) & set(self.dwelling_terms)
        if self.dwelling_classifier.predict(tweet_vector.reshape(1,-1)) and len(dwelling_common)>0:
            print(self.dwelling_terms)
            print(dwelling_common)
            categories.append("DWELLING")

        tweet["categories"] = categories

        return tweet

    def _random_classifier(self,tweet):
        import random

        if len(tweet["categories"]) == 0:
            labels = ["MOBILITY","DWELLING"]

            tweet["categories"] = [random.choice(labels)]

        return tweet
