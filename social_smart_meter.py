from configuration import configuration


class SocialSmartMeter:

    def __init__(self, db):
        self.db = db

    # Online method
    def annotate_tweet_location(self, tweet):
        pass

    def get_tweet_count(self, start_month, end_month,start_day, end_day,start_hour,end_hour):

        query = {
            "_id.month": {
                "$gte": start_month,
                "$lt": end_month
            },
            "_id.day":{
                "$gte":start_day,
                "$lt":end_day
            },
            "_id.hour":{
                "$gte":start_hour,
                "$lt":end_hour
            }
        }

        print(query)

        return list(self.db["tweet_count"].find(query))

    # Offline methods
    def annotate_tweets_location(self):
        city = self.db["area"].find_one({
            "name": configuration.AREA
        })

        areas = city["geojson"]["features"]

        for area in areas:
            print("Selecting tweets from area",area["properties"]["name"])
            self.db["tweet"].update({
                "coordinates": {"$geoWithin": {"$geometry": area["geometry"]}}
            }, {"$set": {"area_name": area["properties"]["name"], "area_id": area["id"]}}
                , multi=True, upsert=False)


