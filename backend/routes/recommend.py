from flask import Blueprint, jsonify
from utils.db import db
import requests
import os
from datetime import datetime, timedelta
import time

recommend_bp = Blueprint('recommend', __name__)

# Configuration
TMDB_API_KEY = os.getenv("TMDB_API_KEY")  # Your Bearer token
TMDB_BASE_URL = "https://api.themoviedb.org/3"
MAX_RECOMMENDATIONS = 10
RECENT_ACTIVITY_DAYS = 30  # Only consider recent activity

@recommend_bp.route('/recommend/<string:user_id>', methods=['GET'])
def recommend_movies(user_id):
    # Input validation
    if not user_id or not isinstance(user_id, str):
        return jsonify({"error": "Invalid user ID format"}), 400

    # Validate API key
    if not TMDB_API_KEY or not TMDB_API_KEY.startswith("eyJ"):
        return jsonify({
            "error": "Invalid TMDB API configuration",
            "solution": "Please set a valid Bearer token in TMDB_API_KEY"
        }), 500

    try:
        # Get user's recent activity
        cutoff_date = datetime.utcnow() - timedelta(days=RECENT_ACTIVITY_DAYS)
        user_movies = list(db.users.find({
            "userId": user_id, 
        }).sort("searchCount", -1).limit(5))

        if not user_movies:
            return jsonify({"message": "No recent activity found"}), 404

        # Analyze genre preferences
        genre_frequency = {}
        for movie in user_movies:
            for genre in movie.get("genre_ids", []):
                genre_frequency[genre] = genre_frequency.get(genre, 0) + movie.get("searchCount", 1)

        if not genre_frequency:
            return jsonify({"message": "No genre preferences found"}), 404

        # Get top 3 genres weighted by search frequency
        top_genres = sorted(genre_frequency.items(), 
                          key=lambda x: (-x[1], x[0]))[:3]
        top_genre_ids = [str(genre[0]) for genre in top_genres]

        # Prepare TMDB API request with Bearer token
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {TMDB_API_KEY}"
        }

        params = {
            "with_genres": ",".join(top_genre_ids),
            "sort_by": "popularity.desc",
            "language": "en-US",
            "include_adult": "false"
        }

        # Make request with retry logic
        for attempt in range(3):
            try:
                response = requests.get(
                    f"{TMDB_BASE_URL}/discover/movie",
                    params=params,
                    headers=headers,
                    timeout=15
                )
                response.raise_for_status()
                break
            except requests.exceptions.RequestException as e:
                if attempt == 2:  # Final attempt
                    raise
                time.sleep(1)  # Wait before retrying

        movies = response.json().get("results", [])[:MAX_RECOMMENDATIONS]
        
        return jsonify([{
            "recommendations": movies,
            "metadata": {
                "top_genres": top_genre_ids,
                "source_movies": [{
                    "movieId": m["movieId"],
                    "title": m["movieName"],
                    "searchCount": m["searchCount"]
                } for m in user_movies[:3]]
            }
        }]), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "TMDB service error",
            "details": str(e),
            "solution": "Please try again later"
        }), 502
    except Exception as e:
        return jsonify({
            "error": "Processing error",
            "details": str(e)
        }), 500