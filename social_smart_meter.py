import math
from configuration import configuration
from shapely.geometry import shape, Point
import geopy.distance
from stop_words import get_stop_words


class SocialSmartMeter:

    def __init__(self, db):
        self.db = db

        self.city = self.db["area"].find_one({
            "name": configuration.AREA
        })

        stop_words_list = get_stop_words("en")

        self.blacklist = ["nah", "just", "one", "new", "now", "last", "massachusetts", "boston", "amp", "careerarc",
                          "latest", "hiring", "click", "xxx", "xxxx"] + stop_words_list

    def get_words_count(self, start_date, end_date, category):

        print(start_date)
        print(end_date)

        match = {
            "$match": {
                "time": {
                    "$gte": start_date,
                    "$lte": end_date
                },
                "categories": category.lower(),
                "area_name": {
                    "$exists": True
                },
                "output.{}.confidence".format(category.lower()): {
                    "$gte": 0.25
                }
            }
        }

        project = {
            "$project": {
                "output.{}.terms".format(category.lower()): 1,
                "area_name": 1
            }
        }

        unwind = {
            "$unwind": "$output.{}.terms".format(category.lower())
        }

        # blacklist = {
        #     "$match": {"tokens": {"$nin": self.blacklist}}
        # }

        projection_of_term_and_type = {
            "$project": {
                "term": "$output.{}.terms.term".format(category.lower()),
                "data_type": "$output.{}.terms.data_type".format(category.lower()),
                "area_name": "$area_name"
            }
        }

        group = {
            "$group": {
                "_id": {
                    "type": "$data_type",
                    "area_name": "$area_name",
                    "term": "$term"
                },
                "count": {
                    "$sum": 1
                }
            }
        }

        final_projection = {
            "$project": {
                "count": 1,
                "term": "$_id.term",
                "type": "$_id.type",
                "area_name": "$_id.area_name",
                "_id": 0
            }
        }

        counts = list(self.db["amsterdam"].aggregate([match, project, unwind, projection_of_term_and_type, group,
                                                      final_projection]))

        return counts

    def get_post_count(self, start_date, end_date, category):

        query = {
            "$match": {
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
        }

        group = {
            "$group": {
                "_id": {
                    "area_name": "$_id.area_name",
                    "category": "$_id.categories"
                },
                "count": {
                    "$sum": "$count"
                }
            }
        }

        project = {
            "$project": {
                "area_name": "$_id.area_name",
                "category": "$_id.category",
                "count": 1,
                "_id": 0
            }
        }

        print(query)

        if category is not None:
            query["$match"]["_id.categories"] = category.lower()
            del group["$group"]["_id"]["category"]

        counts = list(self.db["amsterdam_count"].aggregate([query, group, project]))

        area = self.db["area"].find_one({"name": configuration.AREA}, {"_id": 0})

        total_by_area = []
        for a in area["geojson"]["features"]:
            considered_area = list(filter(lambda x: a["properties"]["name"] == x["area_name"], counts))
            total = 0
            for ca in considered_area:
                total += ca["count"]
                if "category" in ca:
                    a[ca["category"]] = ca["count"]

            a["count"] = total
            total_by_area.append(total)

        max_count = math.log(max(total_by_area)+1)

        print(total_by_area)
        print(max_count)
        # Normalizing

        if max_count > 0:
            for a in area["geojson"]["features"]:
                a["count"] = math.log(a["count"]+1)/max_count

        return area["geojson"]

    def get_posts(self, start, end, category):

        query = {
            "date": {
                "$gte": start,
                "$lt": end
            }
        }

        project = {
            "_id": 0
        }

        if category is not None:
            query["categories"] = category

        posts = self.db["demo"].find(query, project).sort([("date", -1)]).limit(50)

        return list(posts)

    def get_user_displacement(self, start, end):

        match = {
            "$match": {
                "time": {
                    "$gte": start,
                    "$lte": end
                },
                "categories": {
                    "$exists": True
                },
                "place.distance_to_previous": {
                    "$exists": True
                },
                "area_name": {
                    "$exists": True
                }
            }
        }

        project = {
            "$project": {
                "place.distance_to_previous": 1,
                "_id": 1
            }
        }

        group = {
            "$group": {
                "_id": {
                        "distance": "$place.distance_to_previous"
                },
                "count": {
                    "$sum": 1
                }
            }
        }

        final_projection = {
            "$project": {
                "count": 1,
                "distance": "$_id.distance",
                "_id": 0
            }
        }

        data = list(self.db["amsterdam"].aggregate([match, project, group, final_projection]))

        histogram = {}
        for d in data:
            distance = 0
            if d["distance"]:
                distance = d["distance"]
                distance = math.ceil(distance)

            if distance in histogram:
                histogram[distance] += 1
            else:
                histogram[distance] = 1

        return histogram
