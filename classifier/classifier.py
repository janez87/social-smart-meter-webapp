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

    def __init__(self):

        '''self.tweetModel = models.Doc2Vec.load(config.TWEET_MODEL)
        self.food_classifer = joblib.load(config.FOOD_CLASSIFIER)
        self.leisure_classifer = joblib.load(config.LEISURE_CLASSIFIER)
        self.dwelling_classifer = joblib.load(config.DWELLING_CLASSIFIER)
        self.mobility_classifer = joblib.load(config.MOBILITY_CLASSIFIER)'''

    def classify(self,tweet):
        return self._random_classifier(tweet)

    def _random_classifier(self,tweet):
        import random

        labels = ["FOOD","LEISURE","MOBILITY","DWELLING"]

        tweet["categories"] = [random.choice(labels)]

        return tweet
