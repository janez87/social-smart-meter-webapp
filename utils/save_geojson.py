import sys
import json

from pymongo import MongoClient

sys.path.append("../")
from configuration import configuration


client = MongoClient(
    configuration.DB_HOST, configuration.DB_PORT)

db = client[configuration.DB_NAME]

geojson = "../boston.geojson"

print("Opening the geojson file")
data = json.load(open(geojson))

to_save = {
    "name": "amsterdam",
    "geojson": data
}

print("Saving")
db["area"].insert(to_save)
print("Done")
