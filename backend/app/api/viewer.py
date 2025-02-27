import os
import json
import numpy as np
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from io import BytesIO

from app.utils.file_utils import get_user_upload_dir
from app.utils.dicom_utils import load_dicom_series
from app.utils.nifti_utils import load_nifti_file

viewer_bp = Blueprint('viewer', __name__)

# Store user sessions with loaded data
SESSION_DATA = {}

@viewer_bp.route('/load_data', methods=['POST'])
@jwt_required()
def load_data():
    """Load DICOM and NIFTI data for viewing."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    data = request.get_json() or {}
    dicom_dir_name = data.get('dicom_directory')
    nifti_files = data.get('nifti_files', [])
    
    user_dir = get_user_upload_dir(user_id)
    
    # Load DICOM data
    if not dicom_dir_name:
        return jsonify({"error": "DICOM directory is required"}), 400
    
    dicom_dir = os.path.join(user_dir, 'dicom')
    
    try:
        dicom_volume, dicom_metadata = load_dicom_series(dicom_dir)
        
        # Initialize session data
        SESSION_DATA[user_id] = {
            "dicom_volume": dicom_volume,
            "dicom_metadata": dicom_metadata,
            "nifti_data": []
        }
        
        # Load NIfTI data if provided
        if nifti_files:
            nifti_dir = os.path.join(user_dir, 'nifti')
            
            for nifti_file in nifti_files:
                nifti_path = os.path.join(nifti_dir, nifti_file)
                if os.path.exists(nifti_path):
                    nifti_volume, nifti_metadata = load_nifti_file(nifti_path)
                    
                    # Check if NIFTI dimensions match DICOM
                    if nifti_volume.shape != dicom_volume.shape:
                        # Basic resampling could be done here
                        # For now, just warn about the mismatch
                        print(f"Warning: NIfTI dimensions do not match DICOM dimensions: {nifti_file}")
                        print(f"NIfTI: {nifti_volume.shape}, DICOM: {dicom_volume.shape}")
                    
                    SESSION_DATA[user_id]["nifti_data"].append({
                        "filename": nifti_file,
                        "volume": nifti_volume,
                        "metadata": nifti_metadata
                    })
        
        return jsonify({
            "status": "success",
            "dicom_shape": dicom_volume.shape,
            "dicom_metadata": dicom_metadata,
            "nifti_files_loaded": len(SESSION_DATA[user_id]["nifti_data"])
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@viewer_bp.route('/get_slice', methods=['GET'])
@jwt_required()
def get_slice():
    """Get a slice from the loaded volume data."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if user_id not in SESSION_DATA:
        return jsonify({"error": "No data loaded. Please load data first."}), 400
    
    view = request.args.get('view', 'axial')
    slice_index = int(request.args.get('slice_index', 0))
    
    dicom_volume = SESSION_DATA[user_id]["dicom_volume"]
    
    # Get slice based on view
    if view == 'axial':
        if slice_index >= dicom_volume.shape[0]:
            return jsonify({"error": "Slice index out of range"}), 400
        slice_data = dicom_volume[slice_index, :, :]
    elif view == 'coronal':
        if slice_index >= dicom_volume.shape[1]:
            return jsonify({"error": "Slice index out of range"}), 400
        slice_data = dicom_volume[:, slice_index, :]
    elif view == 'sagittal':
        if slice_index >= dicom_volume.shape[2]:
            return jsonify({"error": "Slice index out of range"}), 400
        slice_data = dicom_volume[:, :, slice_index]
    else:
        return jsonify({"error": "Invalid view. Choose from axial, coronal, or sagittal"}), 400
    
    # Generate and return the image
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(slice_data, cmap='gray')
    ax.axis('off')
    
    # Convert plot to PNG image
    img_bytes = BytesIO()
    FigureCanvas(fig).print_png(img_bytes)
    img_bytes.seek(0)
    plt.close(fig)
    
    return send_file(img_bytes, mimetype='image/png')

@viewer_bp.route('/get_metadata', methods=['GET'])
@jwt_required()
def get_metadata():
    """Get metadata for the loaded volumes."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if user_id not in SESSION_DATA:
        return jsonify({"error": "No data loaded. Please load data first."}), 400
    
    dicom_metadata = SESSION_DATA[user_id]["dicom_metadata"]
    nifti_data = SESSION_DATA[user_id]["nifti_data"]
    
    nifti_metadata = [{"filename": data["filename"], "metadata": data["metadata"]} 
                     for data in nifti_data]
    
    return jsonify({
        "status": "success",
        "dicom_metadata": dicom_metadata,
        "nifti_metadata": nifti_metadata
    }), 200