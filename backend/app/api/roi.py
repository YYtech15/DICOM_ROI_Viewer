import os
import json
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
import logging
from redis import Redis
from app.config import Config

from app.utils.file_utils import get_user_upload_dir
from app.utils.nifti_utils import (
    load_nifti_file, 
    create_roi_masks, 
    get_roi_slice, 
    create_roi_overlay_image
)
from app.utils.dicom_utils import get_dicom_slice

# Initialize session storage
redis_client = Redis.from_url(Config.REDIS_URL)

def get_session_data(user_id):
    data = redis_client.get(f"session:{user_id}")
    return json.loads(data) if data else {}

def set_session_data(user_id, data):
    redis_client.setex(
        f"session:{user_id}",
        Config.SESSION_TIMEOUT,
        json.dumps(data)
    )

logger = logging.getLogger(__name__)
roi_bp = Blueprint('roi', __name__)

@roi_bp.route('/process', methods=['POST'])
@jwt_required()
def process_rois():
    """Process NIfTI ROI files and prepare them for visualization."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    data = request.get_json() or {}
    nifti_files = data.get('nifti_files', [])
    dicom_shape = data.get('dicom_shape')
    
    if not nifti_files:
        return jsonify({"error": "No NIfTI files specified"}), 400
    
    if not dicom_shape or len(dicom_shape) != 3:
        return jsonify({"error": "Invalid DICOM shape specified"}), 400
    
    user_dir = get_user_upload_dir(user_id)
    nifti_dir = os.path.join(user_dir, 'nifti')
    
    # Prepare NIfTI file info
    nifti_file_info = []
    for nifti_file in nifti_files:
        file_path = os.path.join(nifti_dir, nifti_file)
        if os.path.exists(file_path):
            nifti_file_info.append({
                'filename': nifti_file,
                'path': file_path
            })
    
    if not nifti_file_info:
        return jsonify({"error": "No valid NIfTI files found"}), 400
    
    try:
        # Create ROI masks
        roi_masks = create_roi_masks(nifti_file_info, tuple(dicom_shape))
        
        # Store in session
        session_data = get_session_data(user_id)
        session_data['roi_masks'] = [
            {
                'filename': mask['filename'],
                'label': mask['label'],
                'mask': mask['mask'].tolist()  # numpy arrayをリストに変換
            }
            for mask in roi_masks
        ]
        set_session_data(user_id, session_data)
        
        # Return ROI info
        roi_info = []
        for mask in roi_masks:
            roi_info.append({
                'filename': mask['filename'],
                'label': mask['label'],
                'unique_values': mask['unique_values'],
                'shape': mask['mask'].shape
            })
        
        return jsonify({
            "status": "success",
            "message": f"Successfully processed {len(roi_masks)} ROI files",
            "roi_info": roi_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing ROI files: {str(e)}")
        return jsonify({"error": "Failed to process ROI files"}), 500

@roi_bp.route('/get_slice', methods=['GET'])
@jwt_required()
def get_roi_slice_image():
    """Get a slice from a processed ROI."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    roi_index = int(request.args.get('roi_index', 0))
    view = request.args.get('view', 'axial')
    slice_index = int(request.args.get('slice_index', 0))
    
    # Map view to axis
    axis_map = {'axial': 0, 'coronal': 1, 'sagittal': 2}
    axis = axis_map.get(view, 0)
    
    if user_id not in get_session_data(user_id) or 'roi_masks' not in get_session_data(user_id):
        return jsonify({"error": "No ROI data loaded. Please process ROI files first."}), 400
    
    roi_masks = get_session_data(user_id)['roi_masks']
    
    if roi_index >= len(roi_masks):
        return jsonify({"error": "ROI index out of range"}), 400
    
    try:
        roi_data = roi_masks[roi_index]['mask']
        
        # Get slice
        if axis == 0:
            if slice_index >= roi_data.shape[0]:
                return jsonify({"error": "Slice index out of range"}), 400
            slice_data = roi_data[slice_index, :, :]
        elif axis == 1:
            if slice_index >= roi_data.shape[1]:
                return jsonify({"error": "Slice index out of range"}), 400
            slice_data = roi_data[:, slice_index, :]
        else:  # axis == 2
            if slice_index >= roi_data.shape[2]:
                return jsonify({"error": "Slice index out of range"}), 400
            slice_data = roi_data[:, :, slice_index]
        
        # Create and return the image
        from matplotlib import pyplot as plt
        from matplotlib.colors import LinearSegmentedColormap
        import numpy as np
        from io import BytesIO
        
        # Create a custom colormap with transparency for zero values
        colors = [(0, 0, 0, 0), (1, 0, 0, 1)]  # Transparent to red
        cmap = LinearSegmentedColormap.from_list('custom_cmap', colors, N=2)
        
        fig, ax = plt.subplots(figsize=(10, 10))
        im = ax.imshow(slice_data, cmap=cmap, interpolation='nearest')
        ax.axis('off')
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', pad_inches=0, transparent=True)
        plt.close(fig)
        buf.seek(0)
        
        return send_file(buf, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error creating ROI slice image: {str(e)}")
        return jsonify({"error": f"Error creating ROI slice image: {str(e)}"}), 500

@roi_bp.route('/get_overlay', methods=['GET'])
@jwt_required()
def get_overlay_image():
    """Get a DICOM slice with ROI overlays."""
    current_user = get_jwt_identity()
    user_id = current_user.get('user_id')
    
    view = request.args.get('view', 'axial')
    slice_index = int(request.args.get('slice_index', 0))
    
    # Map view to axis
    axis_map = {'axial': 0, 'coronal': 1, 'sagittal': 2}
    axis = axis_map.get(view, 0)
    
    if user_id not in get_session_data(user_id):
        return jsonify({"error": "No data loaded"}), 400
    
    if 'dicom_volume' not in get_session_data(user_id):
        return jsonify({"error": "No DICOM data loaded"}), 400
    
    if 'roi_masks' not in get_session_data(user_id) or not get_session_data(user_id)['roi_masks']:
        return jsonify({"error": "No ROI data loaded"}), 400
    
    try:
        dicom_volume = get_session_data(user_id)['dicom_volume']
        roi_masks = get_session_data(user_id)['roi_masks']
        
        # Get DICOM slice
        dicom_slice = get_dicom_slice(dicom_volume, slice_index, axis)
        
        # Get ROI slices
        roi_slices = []
        roi_names = []
        for roi_mask in roi_masks:
            roi_data = roi_mask['mask']
            roi_slice = get_roi_slice(roi_data, slice_index, axis)
            roi_slices.append(roi_slice)
            roi_names.append(roi_mask['label'])
        
        # Create overlay image
        overlay_image = create_roi_overlay_image(dicom_slice, roi_slices, roi_names)
        
        # Return the image
        return send_file(BytesIO(overlay_image), mimetype='image/png')
        
    except Exception as e:
        logger.error(f"Error creating overlay image: {str(e)}")
        return jsonify({"error": f"Error creating overlay image: {str(e)}"}), 500