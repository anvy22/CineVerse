from flask import Blueprint, request, jsonify
from utils.db import db
import datetime
from flask_cors import cross_origin
import requests
import os
from dotenv import load_dotenv
import time
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from typing import Dict, List, Union

# Load environment variables
load_dotenv()
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
if not TMDB_API_KEY:
    raise ValueError("TMDB_API_KEY environment variable not set")

watchlist_bp = Blueprint('watchlist', __name__)

# Configure HTTP session with retry strategy
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[408, 429, 500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session = requests.Session()
session.mount("https://", adapter)
session.headers.update({
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip'
})

# Constants
TMDB_BASE_URL = "https://api.themoviedb.org/3"
REQUEST_TIMEOUT = 10  # seconds
RATE_LIMIT_DELAY = 0.1  # seconds between requests

def fetch_tmdb_movie(movie_id: str) -> Dict:
    """Fetch movie details from TMDB API with robust error handling"""
    url = f"{TMDB_BASE_URL}/movie/{movie_id}"
    headers = {
        'Authorization': f'Bearer {TMDB_API_KEY}',
        'Accept': 'application/json'
    }
    params = {
        'language': 'en-US'
    }

    try:
        response = session.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        # Check for empty response
        if not response.content:
            raise requests.exceptions.RequestException("Empty response from TMDB API")

        data = response.json()
        

        # Validate required fields
        if not isinstance(data.get('id'), int):
            raise ValueError("Invalid movie data received from TMDB")

        return {
            "adult": data.get("adult", False),
            "backdrop_path": data.get("backdrop_path"),
            "genre_ids": [genre["id"] for genre in data.get("genres", [])],
            "id": data["id"],
            "original_language": data.get("original_language", ""),
            "original_title": data.get("original_title", ""),
            "overview": data.get("overview", ""),
            "popularity": data.get("popularity", 0),
            "poster_path": data.get("poster_path"),
            "release_date": data.get("release_date", ""),
            "title": data.get("title", ""),
            "video": data.get("video", False),
            "vote_average": data.get("vote_average", 0),
            "vote_count": data.get("vote_count", 0)
        }

    except requests.exceptions.HTTPError as e:
        if response.status_code == 404:
            raise requests.exceptions.RequestException(f"Movie {movie_id} not found on TMDB")
        elif response.status_code == 429:
            raise requests.exceptions.RequestException("TMDB API rate limit exceeded")
        else:
            raise requests.exceptions.RequestException(f"TMDB API error: {str(e)}")
    except ValueError as e:
        raise requests.exceptions.RequestException(f"Invalid TMDB response: {str(e)}")
    except Exception as e:
        raise requests.exceptions.RequestException(f"Failed to fetch movie: {str(e)}")


@watchlist_bp.route('/addToWatchList', methods=['POST'])
@cross_origin()
def add_to_watchlist():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        movie_id = data.get("movieId")

        if not user_id or not movie_id:
            return jsonify({"error": "Missing userId or movieId"}), 400

        # Validate movie_id format
        if not isinstance(movie_id, (str, int)):
            return jsonify({"error": "movieId must be string or number"}), 400

        result = db.watchlist.update_one(
            {"userId": user_id},
            {
                "$addToSet": {
                    "movieIds": {
                        "movieId": str(movie_id),  # Ensure string format
                        "addedAt": datetime.datetime.utcnow()
                    }
                }
            },
            upsert=True
        )

        return jsonify({
            "success": True,
            "message": "Movie added to watchlist",
            "modified_count": result.modified_count,
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to add movie to watchlist",
            "details": str(e)
        }), 500

@watchlist_bp.route('/getWatchList/<user_id>', methods=['GET'])
@cross_origin()
def get_watchlist(user_id: str) -> tuple:
    try:
        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        watchlist = db.watchlist.find_one({"userId": user_id})
        if not watchlist:
            return jsonify({"movieIds": [], "timestamps": {}}), 200

        movies = watchlist.get("movieIds", [])
        sorted_movies = sorted(movies, key=lambda x: x["addedAt"], reverse=True)

        return jsonify({
            "movieIds": [str(movie["movieId"]) for movie in sorted_movies],  # Ensure string IDs
            "timestamps": {str(movie["movieId"]): movie["addedAt"].isoformat() for movie in sorted_movies}
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch watchlist",
            "details": str(e)
        }), 500

@watchlist_bp.route('/getWatchListMovies/<user_id>', methods=['GET'])
@cross_origin()
def get_watchlist_movies(user_id: str) -> tuple:
    try:
        # Get watchlist first
        watchlist = db.watchlist.find_one({"userId": user_id})
        if not watchlist:
           return jsonify([]), 200

        movies_list = watchlist.get("movieIds", [])
        sorted_movies = sorted(movies_list, key=lambda x: x["addedAt"], reverse=True)
        movie_ids = [str(movie["movieId"]) for movie in sorted_movies]

        
        if not movie_ids:
            return jsonify([]), 200

        # Fetch movie details with rate limiting
        movies = []
        failed_movies = []
        
        for i, movie_id in enumerate(movie_ids):
            try:
                if i > 0:
                    time.sleep(RATE_LIMIT_DELAY)
                
                movie = fetch_tmdb_movie(movie_id)
                movies.append(movie)
                
            except requests.exceptions.RequestException as e:
                failed_movies.append(movie_id)
                print(f"Skipping movie {movie_id}: {str(e)}")
                continue

        response = jsonify(movies)
        
        if failed_movies:
            response.headers['X-Failed-Movies'] = ','.join(failed_movies)
            
        return response, 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch watchlist movies",
            "details": str(e)
        }), 500

@watchlist_bp.route('/removeFromWatchList', methods=['POST'])
@cross_origin()
def remove_from_watchlist():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        movie_id = data.get("movieId")

        if not user_id or not movie_id:
            return jsonify({"error": "Missing userId or movieId"}), 400

        result = db.watchlist.update_one(
            {"userId": user_id},
            {"$pull": {"movieIds": {"movieId": str(movie_id)}}}  # Ensure string format
        )

        if result.modified_count == 0:
            return jsonify({
                "success": False,
                "message": "Movie not found in watchlist"
            }), 404

        return jsonify({
            "success": True,
            "message": "Movie removed from watchlist",
            "modified_count": result.modified_count
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to remove movie from watchlist",
            "details": str(e)
        }), 500