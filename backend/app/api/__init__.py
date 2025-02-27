from flask import Blueprint
from app.api.auth import auth_bp
from app.api.upload import upload_bp
from app.api.viewer import viewer_bp
from app.api.roi import roi_bp

def register_blueprints(app):
    """Register all blueprints for the app."""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(viewer_bp, url_prefix='/api/viewer')
    app.register_blueprint(roi_bp, url_prefix='/api/roi')