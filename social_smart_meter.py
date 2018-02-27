from configuration import configuration


class SocialSmartMeter:

    def __init__(self, db):
        self.db = db

    # Online method
    def annotate_tweet_location(self, tweet):
        pass

    def get_tweet_count(self, start_date, end_date):

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

        counts = list(self.db["tweet_count"].aggregate([query, group, project]))

        area = self.db["area"].find_one({"name": configuration.AREA},{"_id":0})

        for a in area["geojson"]["features"]:
            considered_area = list(filter(lambda x: a["id"] == x["area_id"], counts))
            total = 0
            for ca in considered_area:
                print(ca)
                total += ca["count"]
                a[ca["category"]] = ca["count"]

            a["count"] = total

        return area["geojson"]

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
