from configuration import configuration
from shapely.geometry import shape, Point


class SocialSmartMeter:

    def __init__(self, db):
        self.db = db

        self.city = self.db["area"].find_one({
            "name": configuration.AREA
        })

    def get_words_count(self,start_date,end_date,category):

        print(start_date)
        print(end_date)

        match = {
            "$match":{
                "date":{
                    "$gte":start_date,
                    "$lt":end_date
                },
                "categories":category.upper(),
                "area_name":{
                    "$exists":True
                }
            }
        }

        project = {
            "$project":{
                "tokens":1,
                "area_name":1
            }
        }

        unwind = {
            "$unwind":"$tokens"
        }

        group = {
            "$group":{
                "_id":{
                    "token":"$tokens",
                    "area_name":"$area_name"
                },
                "count":{
                    "$sum":1
                }
            }
        }

        final_projection = {
            "$project":{
                "count":1,
                "token":"$_id.token",
                "area_name":"$_id.area_name",
                "_id":0
            }
        }
        counts = list(self.db["tweet"].aggregate([match,project,unwind, group,final_projection]))

        return counts

    def get_tweet_count(self, start_date, end_date, category):

        query = {
            "$match": {
                "date": {
                    "$gte": start_date,
                    "$lt": end_date
                }
            }
        }


        group = {
            "$group": {
                "_id": {
                    "area_name": "$_id.area_name",
                    "category":"$_id.categories"
                },
                "count": {
                    "$sum": "$count"
                }
            }
        }

        project = {
            "$project": {
                "area_name": "$_id.area_name",
                "category":"$_id.category",
                "count": 1,
                "_id": 0
            }
        }

        print(query)

        if category is not None:
            query["$match"]["_id.categories"] = category.upper()
            del group["$group"]["_id"]["category"]

        counts = list(self.db["tweet_count"].aggregate([query, group, project]))

        area = self.db["area"].find_one({"name": configuration.AREA},{"_id":0})

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

        max_count = max(total_by_area)

        print(total_by_area)
        print(max_count)
        # Normalizing

        if max_count>0:
            for a in area["geojson"]["features"]:
                a["count"] = a["count"]/max_count

        return area["geojson"]

    def get_tweets(self,start,end,category):

        query={
            "date": {
                "$gte": start,
                "$lt": end
            }
        }

        project= {
            "_id":0
        }

        if category is not None:
            query["categories"] = category

        tweets = self.db["tweet"].find(query,project).sort([("date",-1)]).limit(50)

        return list(tweets)



    # Offline methods
    def annotate_tweets_location(self):
        city = self.db["area"].find_one({
            "name": configuration.AREA
        })

        areas = city["geojson"]["features"]

        for area in areas:
            print("Selecting tweets from area", area["properties"]["name"])

            query = {
                "$or": [{
                    "coordinates": {
                        "$geoWithin": {
                            "$geometry": area["geometry"]
                        }
                    }
                }, {
                    "place.name": area["properties"]["name"]
                }
                ]
            }
            self.db["tweet"].update(query, {"$set": {"area_name": area["properties"]["name"]}}
                                    , multi=True, upsert=False)
