import numpy as np
import nibabel as nib

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
            'Data Type': img.header.get_data_dtype(),
            'Affine': img.affine.tolist()
        }
        
        return data, metadata
    except Exception as e:
        raise ValueError(f"Error loading NIfTI file: {str(e)}")