from flask import Blueprint, request, jsonify
from utils.db import db
from bson.json_util import dumps

trending_bp = Blueprint('trending', __name__)
movies_collection = db.movies        # Global trending data
users_collection = db.users         # User-based personalized suggestions

@trending_bp.route('/trending/update', methods=['POST'])
def update_trending():
    data = request.get_json()
    print("Received Data:", data)

    search_term = data.get('searchTerm')
    movie_id = data.get('movieId')
    movie_name = data.get('movieName')
    poster_path = data.get('posterPath')
    user_id = data.get('userId')
    genre_ids = data.get('genre_ids', [])
    vote_average = data.get('vote_average')
    # Validation
    if not search_term or not movie_id or not movie_name or not poster_path or not user_id:
        return jsonify({"error": "Missing required fields in request body"}), 400

    # -------------------------------
    # 1. Update Global Movies Collection
    # -------------------------------
    existing_movie = movies_collection.find_one({
        "searchTerm": search_term,
        "movieId": movie_id
    })

    if existing_movie:
        movies_collection.update_one(
            {"_id": existing_movie["_id"]},
            {"$inc": {"count": 1}}
        )
    else:
        movies_collection.insert_one({
            "searchTerm": search_term,
            "movieId": movie_id,
            "movieName": movie_name,
            "posterPath": poster_path,
            "count": 1
        })

    # -------------------------------
    # 2. Update Personalized User Collection
    # -------------------------------
    existing_user_movie = users_collection.find_one({
        "userId": user_id,
        "movieId": movie_id
    })

    if existing_user_movie:
        users_collection.update_one(
            {"_id": existing_user_movie["_id"]},
            {"$inc": {"searchCount": 1}}
        )
    else:
        users_collection.insert_one({
            "userId": user_id,
            "movieId": movie_id,
            "movieName": movie_name,
            "posterPath": poster_path,
            "genre_ids": genre_ids,
            "searchCount": 1,
            "vote_average":vote_average
            
        })

    return jsonify({"message": "Movie and user data updated"}), 200


@trending_bp.route('/trending/get', methods=['GET'])
def get_trending():
    pipeline = [
        {
            "$group": {
                "_id": "$movieId",
                "movieId": { "$first": "$movieId" },
                "movieName": { "$first": "$movieName" },
                "posterPath": { "$first": "$posterPath" },
                "totalCount": { "$sum": "$count" }
            }
        },
        { "$sort": { "totalCount": -1 } },
        { "$limit": 10 }
    ]

    top_movies = list(movies_collection.aggregate(pipeline))
    return dumps(top_movies), 200
