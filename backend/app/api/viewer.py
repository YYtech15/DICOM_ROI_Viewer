import os
import numpy as np
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from io import BytesIO
import logging
import json
from redis import Redis
from app.config import Config

from app.utils.file_utils import get_user_upload_dir
from app.utils.dicom_utils import (
    load_dicom_series, 
    get_dicom_slice, 
    create_slice_image, 
    apply_windowing
)
from app.utils.nifti_utils import (
    load_nifti_file, 
    get_roi_slice, 
    create_roi_overlay_image
)

logger = logging.getLogger(__name__)

redis_client = Redis.from_url(Config.REDIS_URL)

def get_session_data(user_id):
    """Redisからセッションデータを取得"""
    data = redis_client.get(f"session:{user_id}")
    return json.loads(data) if data else {}

def set_session_data(user_id, data):
    """Redisにセッションデータを保存"""
    redis_client.setex(
        f"session:{user_id}",
        Config.SESSION_TIMEOUT,
        json.dumps(data)
    )

viewer_bp = Blueprint('viewer', __name__)

@viewer_bp.route('/load_dicom', methods=['POST'])
@jwt_required()
def load_dicom():
    """Load DICOM data for viewing."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    data = request.get_json() or {}
    
    user_dir = get_user_upload_dir(user_id)
    dicom_dir = os.path.join(user_dir, 'dicom')
    
    if not os.path.exists(dicom_dir) or not os.listdir(dicom_dir):
        return jsonify({"error": "No DICOM files found"}), 400
    
    try:
        # Load DICOM volume
        dicom_volume, dicom_metadata = load_dicom_series(dicom_dir)
        
        # セッションデータを保存
        session_data = get_session_data(user_id)
        session_data.update({
            'dicom_volume': dicom_volume.tolist(),  # numpy arrayをリストに変換
            'dicom_metadata': dicom_metadata
        })
        set_session_data(user_id, session_data)
        
        return jsonify({
            "status": "success",
            "dicom_shape": dicom_volume.shape,
            "dicom_metadata": dicom_metadata
        }), 200
        
    except Exception as e:
        logger.error(f"Error loading DICOM data: {str(e)}")
        return jsonify({"error": "Failed to load DICOM data"}), 500

@viewer_bp.route('/get_slice', methods=['GET'])
@jwt_required()
def get_slice():
    """Get a slice from the loaded volume data."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if user_id not in SESSION_DATA or 'dicom_volume' not in SESSION_DATA[user_id]:
        return jsonify({"error": "No DICOM data loaded. Please load DICOM data first."}), 400
    
    view = request.args.get('view', 'axial')
    slice_index = int(request.args.get('slice_index', 0))
    window_center = request.args.get('window_center')
    window_width = request.args.get('window_width')
    
    # Convert window parameters to float if provided
    if window_center is not None:
        window_center = float(window_center)
    else:
        # Use default from metadata if available
        window_center = SESSION_DATA[user_id]['dicom_metadata'].get('WindowCenter', 40)
    
    if window_width is not None:
        window_width = float(window_width)
    else:
        # Use default from metadata if available
        window_width = SESSION_DATA[user_id]['dicom_metadata'].get('WindowWidth', 400)
    
    # Map view to axis
    axis_map = {'axial': 0, 'coronal': 1, 'sagittal': 2}
    axis = axis_map.get(view, 0)
    
    dicom_volume = SESSION_DATA[user_id]['dicom_volume']
    
    try:
        # Get dicom slice
        dicom_slice = get_dicom_slice(dicom_volume, slice_index, axis, window_center, window_width)
        
        # Create and return the image
        image_data = create_slice_image(dicom_slice, window_center, window_width)
        
        return send_file(BytesIO(image_data), mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error creating slice image: {str(e)}")
        return jsonify({"error": f"Error creating slice image: {str(e)}"}), 500

@viewer_bp.route('/get_metadata', methods=['GET'])
@jwt_required()
def get_metadata():
    """Get metadata for the loaded volumes."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if user_id not in SESSION_DATA:
        return jsonify({"error": "No data loaded. Please load data first."}), 400
    
    result = {"status": "success"}
    
    if 'dicom_metadata' in SESSION_DATA[user_id]:
        result["dicom_metadata"] = SESSION_DATA[user_id]["dicom_metadata"]
    
    if 'dicom_volume' in SESSION_DATA[user_id]:
        result["dicom_shape"] = SESSION_DATA[user_id]["dicom_volume"].shape
    
    if 'roi_masks' in SESSION_DATA[user_id]:
        roi_info = []
        for mask in SESSION_DATA[user_id]["roi_masks"]:
            roi_info.append({
                'filename': mask['filename'],
                'label': mask['label'],
                'unique_values': mask['unique_values']
            })
        result["roi_info"] = roi_info
    
    return jsonify(result), 200

@viewer_bp.route('/get_combined_view', methods=['GET'])
@jwt_required()
def get_combined_view():
    """Get a combined view of DICOM with ROI overlays."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    if user_id not in SESSION_DATA:
        return jsonify({"error": "No data loaded"}), 400
    
    if 'dicom_volume' not in SESSION_DATA[user_id]:
        return jsonify({"error": "No DICOM data loaded"}), 400
    
    view = request.args.get('view', 'axial')
    slice_index = int(request.args.get('slice_index', 0))
    window_center = request.args.get('window_center')
    window_width = request.args.get('window_width')
    visible_rois = request.args.get('visible_rois')
    
    # Convert window parameters to float if provided
    if window_center is not None:
        window_center = float(window_center)
    else:
        # Use default from metadata if available
        window_center = SESSION_DATA[user_id]['dicom_metadata'].get('WindowCenter', 40)
    
    if window_width is not None:
        window_width = float(window_width)
    else:
        # Use default from metadata if available
        window_width = SESSION_DATA[user_id]['dicom_metadata'].get('WindowWidth', 400)
    
    # Parse visible ROIs list if provided
    visible_roi_indices = []
    if visible_rois:
        try:
            visible_roi_indices = [int(idx) for idx in visible_rois.split(',')]
        except ValueError:
            pass
    
    # Map view to axis
    axis_map = {'axial': 0, 'coronal': 1, 'sagittal': 2}
    axis = axis_map.get(view, 0)
    
    dicom_volume = SESSION_DATA[user_id]['dicom_volume']
    
    try:
        # Get DICOM slice
        dicom_slice = get_dicom_slice(dicom_volume, slice_index, axis, window_center, window_width)
        
        # Prepare ROI slices if available
        roi_slices = []
        roi_names = []
        
        if 'roi_masks' in SESSION_DATA[user_id]:
            roi_masks = SESSION_DATA[user_id]['roi_masks']
            
            # Filter by visible ROIs if specified
            if visible_roi_indices:
                filtered_masks = [roi_masks[idx] for idx in visible_roi_indices if idx < len(roi_masks)]
            else:
                filtered_masks = roi_masks
            
            for roi_mask in filtered_masks:
                roi_data = roi_mask['mask']
                roi_slice = get_roi_slice(roi_data, slice_index, axis)
                roi_slices.append(roi_slice)
                roi_names.append(roi_mask['label'])
        
        # Create combined view
        if roi_slices:
            image_data = create_roi_overlay_image(dicom_slice, roi_slices, roi_names)
        else:
            image_data = create_slice_image(dicom_slice, window_center, window_width)
        
        return send_file(BytesIO(image_data), mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error creating combined view: {str(e)}")
        return jsonify({"error": f"Error creating combined view: {str(e)}"}), 500