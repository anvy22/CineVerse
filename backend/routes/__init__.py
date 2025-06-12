from flask import Blueprint
from .trending import trending_bp
from .recommend import recommend_bp
from .watchlist import watchlist_bp

def register_routes(app):
    app.register_blueprint(trending_bp)
    app.register_blueprint(recommend_bp)
    app.register_blueprint(watchlist_bp)