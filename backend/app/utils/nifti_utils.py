import os
import numpy as np
import nibabel as nib
from scipy.ndimage import zoom
import logging
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from io import BytesIO

logger = logging.getLogger(__name__)

def load_nifti_file(file_path):
    """
    Load a NIfTI file and extract the volume data and metadata.
    
    Args:
        file_path (str): Path to the NIfTI file.
        
    Returns:
        numpy.ndarray: The 3D volume data.
        dict: Metadata extracted from the NIfTI file.
    """
    try:
        img = nib.load(file_path)
        data = img.get_fdata()
        
        # Extract metadata
        metadata = {
            'Dimensions': img.header.get_data_shape(),
            'Voxel Size': img.header.get_zooms(),
            'Data Type': str(img.header.get_data_dtype()),
            'Affine': img.affine.tolist(),
            'Filename': os.path.basename(file_path),
            'Label': os.path.splitext(os.path.basename(file_path))[0]
        }
        
        # Handle .nii.gz case for label
        if metadata['Label'].endswith('.nii'):
            metadata['Label'] = os.path.splitext(metadata['Label'])[0]
        
        return data, metadata
    except Exception as e:
        logger.error(f"Error loading NIfTI file: {str(e)}")
        raise ValueError(f"Error loading NIfTI file: {str(e)}")

def resample_nifti(nifti_data, original_shape, target_shape):
    """
    Resample a NIfTI volume to match the target shape.
    
    Args:
        nifti_data (numpy.ndarray): The NIfTI volume data.
        original_shape (tuple): The original shape of the NIfTI data.
        target_shape (tuple): The target shape to resample to.
        
    Returns:
        numpy.ndarray: The resampled NIfTI data.
    """
    if original_shape == target_shape:
        return nifti_data
    
    # Calculate resize factors
    resize_factors = [t / o for t, o in zip(target_shape, original_shape)]
    
    # Perform resampling
    # Use order=0 (nearest neighbor) to preserve label values
    resampled = zoom(nifti_data, resize_factors, order=0, mode='nearest')
    
    # Ensure the output shape matches exactly
    if resampled.shape != target_shape:
        logger.warning(f"Resampling didn't produce exact target shape. Got {resampled.shape}, expected {target_shape}")
        
        # Pad or crop if necessary
        pad_width = [(0, max(0, target_shape[i] - resampled.shape[i])) for i in range(len(target_shape))]
        resampled = np.pad(resampled, pad_width)
        
        # Crop if larger
        if any(resampled.shape[i] > target_shape[i] for i in range(len(target_shape))):
            slices = tuple(slice(0, target_shape[i]) for i in range(len(target_shape)))
            resampled = resampled[slices]
    
    return resampled

def create_roi_masks(nifti_files, dicom_shape):
    """
    Create binary masks from NIfTI files and resample them to match the DICOM shape.
    
    Args:
        nifti_files (list): List of dictionaries with NIfTI file information.
        dicom_shape (tuple): Shape of the DICOM volume.
        
    Returns:
        list: List of dictionaries with NIfTI data and metadata.
    """
    roi_masks = []
    
    for nifti_info in nifti_files:
        try:
            file_path = nifti_info['path']
            data, metadata = load_nifti_file(file_path)
            
            # Get unique values (should be 0 and label values)
            unique_values = np.unique(data)
            
            # Create binary mask (anything non-zero is part of the ROI)
            binary_mask = (data > 0).astype(np.uint8)
            
            # Resample mask to match DICOM shape if necessary
            if data.shape != dicom_shape:
                logger.info(f"Resampling NIfTI from {data.shape} to {dicom_shape}")
                resampled_mask = resample_nifti(binary_mask, data.shape, dicom_shape)
            else:
                resampled_mask = binary_mask
            
            # Add to list
            roi_masks.append({
                'filename': metadata['Filename'],
                'label': metadata['Label'],
                'mask': resampled_mask,
                'metadata': metadata,
                'unique_values': unique_values.tolist()
            })
            
        except Exception as e:
            logger.error(f"Error processing NIfTI file {nifti_info['path']}: {str(e)}")
            continue
    
    return roi_masks

def apply_roi_overlay(dicom_slice, roi_slices, alpha=0.5, colormap=None):
    """
    Apply ROI overlays to a DICOM slice.
    
    Args:
        dicom_slice (numpy.ndarray): The DICOM slice data.
        roi_slices (list): List of ROI slices to overlay.
        alpha (float, optional): Transparency of the overlay.
        colormap (list, optional): List of colors for each ROI.
        
    Returns:
        numpy.ndarray: The overlaid image.
    """
    # Normalize DICOM slice to [0, 1] if not already
    if dicom_slice.max() > 1.0:
        dicom_slice = (dicom_slice - dicom_slice.min()) / (dicom_slice.max() - dicom_slice.min())
    
    # Create RGB image from grayscale DICOM
    rgb_image = np.stack([dicom_slice] * 3, axis=-1)
    
    # Default colormap if none provided
    if colormap is None:
        colormap = [
            [1.0, 0.0, 0.0],  # Red
            [0.0, 1.0, 0.0],  # Green
            [0.0, 0.0, 1.0],  # Blue
            [1.0, 1.0, 0.0],  # Yellow
            [1.0, 0.0, 1.0],  # Magenta
            [0.0, 1.0, 1.0],  # Cyan
            [1.0, 0.5, 0.0],  # Orange
            [0.5, 0.0, 1.0],  # Purple
            [0.0, 0.5, 0.0],  # Dark Green
        ]
    
    # Apply each ROI overlay
    for i, roi_slice in enumerate(roi_slices):
        if roi_slice is None or np.all(roi_slice == 0):
            continue
        
        color_idx = i % len(colormap)
        color = colormap[color_idx]
        
        # Create color mask
        color_mask = np.zeros_like(rgb_image)
        for c in range(3):
            color_mask[:, :, c] = roi_slice * color[c]
        
        # Apply the overlay with transparency
        mask = roi_slice > 0
        for c in range(3):
            rgb_image[:, :, c] = np.where(
                mask,
                rgb_image[:, :, c] * (1 - alpha) + color_mask[:, :, c] * alpha,
                rgb_image[:, :, c]
            )
    
    return np.clip(rgb_image, 0, 1)

def get_roi_slice(roi_data, slice_index, axis=0):
    """
    Extract a 2D slice from a 3D ROI volume along a specified axis.
    
    Args:
        roi_data (numpy.ndarray): The 3D ROI volume.
        slice_index (int): The index of the slice to extract.
        axis (int, optional): The axis along which to extract the slice (0, 1, or 2).
        
    Returns:
        numpy.ndarray: The extracted 2D slice.
    """
    if axis == 0:
        slice_data = roi_data[slice_index, :, :]
    elif axis == 1:
        slice_data = roi_data[:, slice_index, :]
    elif axis == 2:
        slice_data = roi_data[:, :, slice_index]
    else:
        raise ValueError("Axis must be 0, 1, or 2")
    
    return slice_data

def create_roi_colormap(n_colors=10):
    """
    Create a colormap for ROI visualization.
    
    Args:
        n_colors (int, optional): Number of colors in the colormap.
        
    Returns:
        matplotlib.colors.LinearSegmentedColormap: The colormap.
    """
    # Define a set of distinct colors
    colors = [
        [1.0, 0.0, 0.0],  # Red
        [0.0, 1.0, 0.0],  # Green
        [0.0, 0.0, 1.0],  # Blue
        [1.0, 1.0, 0.0],  # Yellow
        [1.0, 0.0, 1.0],  # Magenta
        [0.0, 1.0, 1.0],  # Cyan
        [1.0, 0.5, 0.0],  # Orange
        [0.5, 0.0, 1.0],  # Purple
        [0.0, 0.5, 0.0],  # Dark Green
        [0.5, 0.5, 0.0],  # Olive
    ]
    
    # Repeat colors if n_colors > len(colors)
    if n_colors > len(colors):
        colors = colors * (n_colors // len(colors) + 1)
    
    # Truncate to the requested number of colors
    colors = colors[:n_colors]
    
    # Create colormap
    return LinearSegmentedColormap.from_list('roi_colormap', colors, N=n_colors)

def create_roi_overlay_image(dicom_slice, roi_slices, roi_names=None, colormap=None, alpha=0.5):
    """
    Create an image with ROI overlays.
    
    Args:
        dicom_slice (numpy.ndarray): The DICOM slice data.
        roi_slices (list): List of ROI slices to overlay.
        roi_names (list, optional): List of ROI names for the legend.
        colormap (list, optional): List of colors for each ROI.
        alpha (float, optional): Transparency of the overlay.
        
    Returns:
        bytes: PNG image data as bytes.
    """
    # Apply ROI overlay
    overlaid_image = apply_roi_overlay(dicom_slice, roi_slices, alpha, colormap)
    
    # Create figure
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(overlaid_image)
    ax.axis('off')
    
    # Add legend if ROI names are provided
    if roi_names is not None and len(roi_slices) > 0:
        legend_elements = []
        for i, name in enumerate(roi_names):
            if i < len(roi_slices) and not np.all(roi_slices[i] == 0):
                color_idx = i % len(colormap) if colormap else i
                color = colormap[color_idx] if colormap else plt.cm.tab10(i / 10)
                legend_elements.append(plt.Line2D([0], [0], marker='s', color='w',
                                       markerfacecolor=color, markersize=10, label=name))
        
        if legend_elements:
            ax.legend(handles=legend_elements, loc='upper right', fontsize='small', 
                      framealpha=0.7, facecolor='white')
    
    plt.tight_layout()
    
    # Convert plot to PNG image
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    
    return buf.getvalue()