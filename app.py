from flask import Flask, send_from_directory

app = Flask(__name__, static_folder=None)

# Головна сторінка
@app.get("/")
def home():
    return send_from_directory("site", "index.html")

# Всі інші файли: css/js/json/photos/...
@app.get("/<path:path>")
def assets(path: str):
    return send_from_directory("site", path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
