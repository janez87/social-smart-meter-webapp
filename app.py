from flask import Flask, render_template,request, jsonify
import pymongo
from configuration import configuration

app = Flask(__name__)
client = pymongo.MongoClient(
    configuration.DB_HOST, configuration.DB_PORT)

db = client[configuration.DB_NAME]
@app.route('/')
def contacts():
    return render_template('index.html', title='Social Smart Meter')

@app.route('/area')
def get_area():
    name = request.args.get("name")
    area = db["area"].find_one({"name":name})
    return jsonify(area["geojson"])

if __name__ == '__main__':
    app.run(debug=True)
