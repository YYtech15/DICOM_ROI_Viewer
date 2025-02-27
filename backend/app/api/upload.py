import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import logging

from app.utils.file_utils import allowed_file, save_uploaded_file, get_user_upload_dir
from app.utils.dicom_utils import load_dicom_series, extract_dicom_metadata
from app.api.auth import jwt_required_with_error_handling

logger = logging.getLogger(__name__)

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
        return jsonify({"error": "No valid DICOM files were uploaded"}), 400
    
    # Try to load the DICOM series to validate it
    try:
        user_dir = get_user_upload_dir(user_id)
        dicom_dir = os.path.join(user_dir, 'dicom')
        
        # Only try loading if we have enough files (arbitrary threshold)
        if len(saved_files) > 3:
            volume, metadata = load_dicom_series(dicom_dir)
            series_info = {
                "shape": volume.shape,
                "metadata": metadata
            }
        else:
            # For single files, just read the metadata
            dcm_path = os.path.join(dicom_dir, saved_files[0]['saved_filename'])
            import pydicom
            dcm = pydicom.dcmread(dcm_path)
            metadata = extract_dicom_metadata(dcm)
            series_info = {
                "metadata": metadata
            }
            
        return jsonify({
            "status": "success",
            "files": saved_files,
            "count": len(saved_files),
            "series_info": series_info
        }), 201
    except Exception as e:
        logger.error(f"Error processing uploaded DICOM files: {str(e)}")
        
        # Still return success for the upload, even if processing failed
        return jsonify({
            "status": "success",
            "warning": f"Files uploaded but could not be processed: {str(e)}",
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
        return jsonify({"error": "No valid NIfTI files were uploaded"}), 400
    
    # Get ROI labels from filenames
    roi_labels = []
    for file_info in saved_files:
        original_name = file_info['original_filename']
        # Extract name without extension
        label = os.path.splitext(original_name)[0]
        if label.endswith('.nii'):  # Handle .nii.gz case
            label = os.path.splitext(label)[0]
        roi_labels.append({
            "filename": file_info['saved_filename'],
            "label": label,
            "path": file_info['path']
        })
    
    return jsonify({
        "status": "success",
        "files": saved_files,
        "roi_labels": roi_labels,
        "count": len(saved_files)
    }), 201

@upload_bp.route('/list', methods=['GET'])
@jwt_required()
def list_uploads():
    """List all uploaded files for the current user."""
    try:
        current_user = get_jwt_identity()
        if not current_user or 'user_id' not in current_user:
            return jsonify({"error": "Invalid user ID"}), 401
            
        user_id = current_user['user_id']
        user_dir = get_user_upload_dir(user_id)
        
        if not os.path.exists(user_dir):
            return jsonify({
                "dicom": [],
                "nifti": []
            }), 200
            
        files = {
            "dicom": get_files_in_directory(os.path.join(user_dir, 'dicom')),
            "nifti": get_files_in_directory(os.path.join(user_dir, 'nifti'))
        }
        
        return jsonify(files), 200
        
    except Exception as e:
        logger.error(f"Error listing uploads: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500