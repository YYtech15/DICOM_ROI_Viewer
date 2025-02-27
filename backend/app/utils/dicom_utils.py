import os
import numpy as np
import pydicom
from pydicom.errors import InvalidDicomError
from scipy.ndimage import zoom
import matplotlib.pyplot as plt
from io import BytesIO
import json
import logging

logger = logging.getLogger(__name__)

def load_dicom_series(directory):
    """
    Load a series of DICOM files from a directory and stack them into a 3D volume.
    
    Args:
        directory (str): The directory containing the DICOM files.
        
    Returns:
        numpy.ndarray: The 3D volume data.
        dict: Metadata extracted from the DICOM files.
    """
    dicom_files = [os.path.join(directory, f) for f in os.listdir(directory)
                 if f.lower().endswith('.dcm')]
    
    if not dicom_files:
        raise ValueError("No DICOM files found in the specified directory.")
    
    # Sort files by instance number or slice location
    slices = []
    for file_path in dicom_files:
        try:
            dcm = pydicom.dcmread(file_path)
            slices.append(dcm)
        except InvalidDicomError:
            logger.warning(f"Skipping invalid DICOM file: {file_path}")
            continue
    
    if not slices:
        raise ValueError("No valid DICOM files found in the specified directory.")
    
    # Sort by ImagePositionPatient's z-coordinate or instance number
    try:
        slices.sort(key=lambda x: float(x.ImagePositionPatient[2]))
    except (AttributeError, IndexError):
        try:
            slices.sort(key=lambda x: int(x.InstanceNumber))
        except (AttributeError, ValueError):
            logger.warning("Unable to determine proper order based on standard attributes, using filename order")
            slices.sort(key=lambda x: x.filename)
    
    # Extract metadata from the first slice
    metadata = extract_dicom_metadata(slices[0])
    metadata['NumSlices'] = len(slices)
    
    # Create 3D array
    img_shape = (len(slices), int(slices[0].Rows), int(slices[0].Columns))
    volume = np.zeros(img_shape, dtype=np.float32)
    
    # Fill the array with pixel data and convert to HU if possible
    for i, slice in enumerate(slices):
        pixel_array = slice.pixel_array.astype(np.float32)
        
        # Convert to HU if possible
        if hasattr(slice, 'RescaleSlope') and hasattr(slice, 'RescaleIntercept'):
            volume[i, :, :] = pixel_array * slice.RescaleSlope + slice.RescaleIntercept
        else:
            volume[i, :, :] = pixel_array
    
    return volume, metadata

def extract_dicom_metadata(dcm):
    """
    Extract relevant metadata from a DICOM dataset.
    
    Args:
        dcm (pydicom.dataset.FileDataset): The DICOM dataset.
        
    Returns:
        dict: A dictionary of metadata.
    """
    metadata = {
        'PatientID': getattr(dcm, 'PatientID', 'Unknown'),
        'PatientName': str(getattr(dcm, 'PatientName', 'Unknown')),
        'PatientBirthDate': getattr(dcm, 'PatientBirthDate', 'Unknown'),
        'PatientSex': getattr(dcm, 'PatientSex', 'Unknown'),
        'StudyDescription': getattr(dcm, 'StudyDescription', 'Unknown'),
        'StudyDate': getattr(dcm, 'StudyDate', 'Unknown'),
        'Modality': getattr(dcm, 'Modality', 'Unknown'),
        'SliceThickness': getattr(dcm, 'SliceThickness', 0),
        'PixelSpacing': getattr(dcm, 'PixelSpacing', [1, 1]),
        'Rows': getattr(dcm, 'Rows', 0),
        'Columns': getattr(dcm, 'Columns', 0),
        'WindowCenter': getattr(dcm, 'WindowCenter', 40),
        'WindowWidth': getattr(dcm, 'WindowWidth', 400),
    }
    
    # Anonymize patient information for security
    metadata['PatientID'] = 'ANON' + metadata['PatientID'][-4:] if len(metadata['PatientID']) > 4 else 'ANON'
    metadata['PatientName'] = 'Anonymous'
    metadata['PatientBirthDate'] = metadata['PatientBirthDate'][:4] + '0101' if len(metadata['PatientBirthDate']) >= 4 else 'Unknown'
    
    return metadata

def apply_windowing(image, window_center, window_width):
    """
    Apply windowing to adjust contrast and brightness of the image.
    
    Args:
        image (numpy.ndarray): The input image.
        window_center (float): The window center (level).
        window_width (float): The window width.
        
    Returns:
        numpy.ndarray: The windowed image normalized to [0, 1].
    """
    window_min = window_center - window_width // 2
    window_max = window_center + window_width // 2
    
    windowed = np.clip(image, window_min, window_max)
    
    # Normalize to [0, 1]
    if window_max != window_min:
        windowed = (windowed - window_min) / (window_max - window_min)
    else:
        windowed = np.zeros_like(windowed)
    
    return windowed

def resample_volume(volume, original_spacing, target_spacing=(1.0, 1.0, 1.0)):
    """
    Resample a 3D volume to a target spacing.
    
    Args:
        volume (numpy.ndarray): The input 3D volume.
        original_spacing (tuple or list): The original spacing (z, y, x).
        target_spacing (tuple or list, optional): The target spacing (z, y, x).
        
    Returns:
        numpy.ndarray: The resampled volume.
    """
    if original_spacing == target_spacing:
        return volume
    
    # Calculate resize factors
    resize_factors = [orig / target for orig, target in zip(original_spacing, target_spacing)]
    
    # Perform resampling using scipy's zoom
    resampled = zoom(volume, resize_factors, order=1, mode='nearest')
    
    return resampled

def get_dicom_slice(volume, slice_index, axis=0, window_center=None, window_width=None):
    """
    Extract a 2D slice from a 3D volume along a specified axis.
    
    Args:
        volume (numpy.ndarray): The 3D volume.
        slice_index (int): The index of the slice to extract.
        axis (int, optional): The axis along which to extract the slice (0, 1, or 2).
        window_center (float, optional): Window center for contrast adjustment.
        window_width (float, optional): Window width for contrast adjustment.
        
    Returns:
        numpy.ndarray: The extracted 2D slice.
    """
    if axis == 0:
        slice_data = volume[slice_index, :, :]
    elif axis == 1:
        slice_data = volume[:, slice_index, :]
    elif axis == 2:
        slice_data = volume[:, :, slice_index]
    else:
        raise ValueError("Axis must be 0, 1, or 2")
    
    # Apply windowing if specified
    if window_center is not None and window_width is not None:
        slice_data = apply_windowing(slice_data, window_center, window_width)
    
    return slice_data

def create_slice_image(slice_data, window_center=None, window_width=None, colormap='gray'):
    """
    Create a displayable image from a 2D slice.
    
    Args:
        slice_data (numpy.ndarray): The 2D slice data.
        window_center (float, optional): Window center for contrast adjustment.
        window_width (float, optional): Window width for contrast adjustment.
        colormap (str, optional): The colormap to use.
        
    Returns:
        bytes: PNG image data as bytes.
    """
    # Apply windowing if specified and not already done
    if window_center is not None and window_width is not None and slice_data.max() > 1.0:
        slice_data = apply_windowing(slice_data, window_center, window_width)
    
    fig, ax = plt.subplots(figsize=(10, 10))
    im = ax.imshow(slice_data, cmap=colormap)
    ax.axis('off')
    plt.tight_layout()
    
    # Convert plot to PNG image
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    
    return buf.getvalue()

def load_hounsfield_ranges(file_path='app/data/hounsfield_ranges.json'):
    """
    Load Hounsfield Unit ranges from a JSON file.
    
    Args:
        file_path (str): Path to the JSON file.
        
    Returns:
        list: A list of [min_hu, max_hu, value] lists.
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data['hu_ranges']
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Error loading Hounsfield ranges: {e}")
        # Default Hounsfield ranges if file not found
        return [
            [-1000, -100, 1],   # Air
            [-100, -50, 2],     # Fat
            [-50, 40, 3],       # Soft Tissue
            [40, 400, 4],       # Bone
            [400, 3000, 5]      # Dense Bone/Metal
        ]

def apply_hounsfield_segmentation(volume, ranges=None):
    """
    Segment a volume based on Hounsfield Unit ranges.
    
    Args:
        volume (numpy.ndarray): The input volume.
        ranges (list, optional): A list of [min_hu, max_hu, value] lists.
        
    Returns:
        numpy.ndarray: The segmented volume.
    """
    if ranges is None:
        ranges = load_hounsfield_ranges()
    
    segmented = np.zeros_like(volume, dtype=np.uint8)
    
    for min_hu, max_hu, value in ranges:
        mask = (volume >= min_hu) & (volume < max_hu)
        segmented[mask] = value
    
    return segmented