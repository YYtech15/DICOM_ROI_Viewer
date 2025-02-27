import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Mock user database (replace with a real database in production)
users = {
    "admin": {
        "password_hash": generate_password_hash("password123"),
        "role": "admin"
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """Handle user login."""
    data = request.get_json() or {}
    username = data.get('username') or request.form.get('username')
    password = data.get('password') or request.form.get('password')
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
    
    if username not in users:
        return jsonify({"error": "Invalid credentials"}), 401
    
    if not check_password_hash(users[username]["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # ユーザーIDを固定化（開発用）
    user_id = f"user_{username}"
    
    # アクセストークンの作成
    access_token = create_access_token(
        identity={"username": username, "user_id": user_id, "role": users[username]["role"]},
        fresh=True
    )
    
    # ログで確認できるようにする
    current_app.logger.info(f"User {username} logged in successfully")
    
    return jsonify({
        "status": "success",
        "access_token": access_token,
        "user": {
            "id": user_id,
            "username": username,
            "role": users[username]["role"]
        }
    }), 200

# # Mock user database (replace with a real database in production)
# users = {
#     "admin": {
#         "password_hash": generate_password_hash("password123"),
#         "role": "admin"
#     },
#     "user": {
#         "password_hash": generate_password_hash("user123"),
#         "role": "user"
#     },
#     "test": {
#         "password_hash": generate_password_hash("test123"),
#         "role": "user"
#     }
# }

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Handle user logout."""
    return jsonify({"status": "success", "message": "Logged out successfully"}), 200

def jwt_required_with_error_handling():
    """JWT検証のエラーハンドリングを追加したデコレータ"""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            try:
                current_user = get_jwt_identity()
                if not current_user:
                    return jsonify({"error": "Invalid token"}), 401
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"JWT verification error: {str(e)}")
                return jsonify({"error": "Authentication failed"}), 401
        return wrapper
    return decorator

@auth_bp.route('/user', methods=['GET'])
@jwt_required_with_error_handling()
def get_user():
    current_user = get_jwt_identity()
    return jsonify(current_user), 200

@auth_bp.route('/check', methods=['GET'])
@jwt_required()
def check_auth():
    """認証状態をチェック"""
    current_user = get_jwt_identity()
    return jsonify({
        "status": "success",
        "user": current_user
    }), 200