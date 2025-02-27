import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base config."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    MAX_CONTENT_LENGTH = 1024 * 1024 * 1024  # 1GB max upload size
    ALLOWED_EXTENSIONS = {'dcm', 'nii', 'nii.gz'}
    
    # Redis設定を追加
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    SESSION_TIMEOUT = 3600  # セッションの有効期限（秒）

class DevelopmentConfig(Config):
    """Development config."""
    DEBUG = True
    TESTING = False
    UPLOAD_FOLDER = os.path.join(basedir, "..", "uploads", "development")

class TestingConfig(Config):
    """Testing config."""
    DEBUG = True
    TESTING = True
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test_uploads')

class ProductionConfig(Config):
    """Production config."""
    DEBUG = False
    TESTING = False
    UPLOAD_FOLDER = os.path.join(basedir, "..", "uploads", "production")

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}