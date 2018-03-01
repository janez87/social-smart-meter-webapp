from configuration import configuration
from shapely.geometry import shape, Point


class SocialSmartMeter:

    def __init__(self, db):
        self.db = db

        self.city = self.db["area"].find_one({
            "name": configuration.AREA
        })


    # Online method
    def annotate_tweet_location(self, tweet):

        if tweet["geo"] is None and tweet["place"] is None:
            return tweet

        point = None
        if tweet["geo"] is not None:
            point = Point(tweet["geo"]["coordinates"][0],tweet["geo"]["coordinates"][1])

        for a in self.city["geojson"]["features"]:
            area = shape(a["geometry"])
            if (point is not None and area.contains(point)) or a["properties"]["name"] == tweet["place"]["name"]:
                tweet["area_name"] = a["properties"]["name"]
                tweet["area_id"] = a["id"]
                print(tweet["area_name"])
                break

        return tweet

    def classify_tweet(self, tweet):
        pass

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
                "area_name":1,
                "area_id":1
            }
        }

        unwind = {
            "$unwind":"$tokens"
        }

        group = {
            "$group":{
                "_id":{
                    "token":"$tokens",
                    "area_name":"$area_name",
                    "area_id":"$area_id"
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
                "area_id":"$_id.area_id",
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
                    "area_id": "$_id.area_id",
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
                "area_id": "$_id.area_id",
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

        for a in area["geojson"]["features"]:
            considered_area = list(filter(lambda x: a["id"] == x["area_id"], counts))
            total = 0
            for ca in considered_area:
                total += ca["count"]
                if "category" in ca:
                    a[ca["category"]] = ca["count"]

            a["count"] = total

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
            self.db["tweet"].update(query, {"$set": {"area_name": area["properties"]["name"], "area_id": area["id"]}}
                                    , multi=True, upsert=False)
