from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    from routes import register_routes
    register_routes(app)

    return app

if __name__ == '__main__':
    app = create_app()
    print("Connected to database")
    app.run(debug=True, port=5000)
