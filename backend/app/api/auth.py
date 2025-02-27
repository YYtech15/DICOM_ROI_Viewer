import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

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
    
    # Create a user session
    user_id = str(uuid.uuid4())
    
    # Create an access token
    access_token = create_access_token(
        identity={"username": username, "user_id": user_id, "role": users[username]["role"]}
    )
    
    return jsonify({
        "status": "success",
        "access_token": access_token,
        "user_id": user_id
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Handle user logout."""
    return jsonify({"status": "success", "message": "Logged out successfully"}), 200

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get the current user information."""
    current_user = get_jwt_identity()
    return jsonify({"user": current_user}), 200