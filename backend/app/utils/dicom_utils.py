import os
import numpy as np
import pydicom
from pydicom.errors import InvalidDicomError

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
            continue  # Skip invalid DICOM files
    
    # Sort by ImagePositionPatient's z-coordinate or instance number
    try:
        slices.sort(key=lambda x: float(x.ImagePositionPatient[2]))
    except (AttributeError, IndexError):
        try:
            slices.sort(key=lambda x: int(x.InstanceNumber))
        except (AttributeError, ValueError):
            raise ValueError("Unable to determine the proper order of DICOM files.")
    
    # Extract metadata from the first slice
    metadata = {
        'PatientID': getattr(slices[0], 'PatientID', 'Unknown'),
        'Modality': getattr(slices[0], 'Modality', 'Unknown'),
        'SliceThickness': getattr(slices[0], 'SliceThickness', 0),
        'PixelSpacing': getattr(slices[0], 'PixelSpacing', [1, 1]),
        'Rows': getattr(slices[0], 'Rows', 0),
        'Columns': getattr(slices[0], 'Columns', 0),
        'NumSlices': len(slices)
    }
    
    # Create 3D array
    img_shape = (len(slices), int(slices[0].Rows), int(slices[0].Columns))
    volume = np.zeros(img_shape, dtype=np.int16)
    
    # Fill the array with pixel data and convert to HU if possible
    for i, slice in enumerate(slices):
        pixel_array = slice.pixel_array
        
        # Convert to HU if possible
        if hasattr(slice, 'RescaleSlope') and hasattr(slice, 'RescaleIntercept'):
            volume[i, :, :] = pixel_array * slice.RescaleSlope + slice.RescaleIntercept
        else:
            volume[i, :, :] = pixel_array
    
    return volume, metadata