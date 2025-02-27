import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from app.api import register_blueprints
from app.config import config_by_name

jwt = JWTManager()

def create_app(config_name="development"):
    load_dotenv()
    
    app = Flask(__name__)
    
    # Configure the app
    app_config = config_by_name[config_name]
    app.config.from_object(app_config)
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    jwt.init_app(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Ensure upload directories exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app