import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.utils.file_utils import allowed_file, save_uploaded_file, get_user_upload_dir

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/dicom', methods=['POST'])
@jwt_required()
def upload_dicom():
    """Handle DICOM file uploads."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    saved_files = []
    for file in files:
        if not allowed_file(file.filename):
            continue
        
        file_info = save_uploaded_file(file, user_id, 'dicom')
        if file_info:
            saved_files.append(file_info)
    
    if not saved_files:
        return jsonify({"error": "No valid files were uploaded"}), 400
    
    return jsonify({
        "status": "success",
        "files": saved_files,
        "count": len(saved_files)
    }), 201

@upload_bp.route('/nifti', methods=['POST'])
@jwt_required()
def upload_nifti():
    """Handle NIfTI file uploads."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    saved_files = []
    for file in files:
        if not allowed_file(file.filename):
            continue
        
        file_info = save_uploaded_file(file, user_id, 'nifti')
        if file_info:
            saved_files.append(file_info)
    
    if not saved_files:
        return jsonify({"error": "No valid files were uploaded"}), 400
    
    return jsonify({
        "status": "success",
        "files": saved_files,
        "count": len(saved_files)
    }), 201

@upload_bp.route('/list', methods=['GET'])
@jwt_required()
def list_uploads():
    """List all uploaded files for the current user."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    user_dir = get_user_upload_dir(user_id)
    
    dicom_dir = os.path.join(user_dir, 'dicom')
    nifti_dir = os.path.join(user_dir, 'nifti')
    
    files = {
        "dicom": [],
        "nifti": []
    }
    
    if os.path.exists(dicom_dir):
        files["dicom"] = [f for f in os.listdir(dicom_dir) if allowed_file(f)]
    
    if os.path.exists(nifti_dir):
        files["nifti"] = [f for f in os.listdir(nifti_dir) if allowed_file(f)]
    
    return jsonify({
        "status": "success",
        "files": files
    }), 200