import flask

app = flask.Flask("agritech")


@app.route("/")
def home():
    return "welcome to agritech backend!"

@app.route("/fetch-data", methods=["GET"])
def fetch_data():
    pass


if __name__ == "__main__":
    app.run(host="0.0.0.0",port=5000)