import httpClient from './httpClient';

const processRois = (niftiFiles: string[], dicomShape: number[]) => {
  return httpClient.post('/roi/process', {
    nifti_files: niftiFiles,
    dicom_shape: dicomShape,
  });
};

const getRoiSlice = (roiIndex: number, view: string, sliceIndex: number) => {
  return httpClient.get(`/roi/get_slice?roi_index=${roiIndex}&view=${view}&slice_index=${sliceIndex}`, {
    responseType: 'blob',
  });
};

const getOverlayImage = (view: string, sliceIndex: number) => {
  return httpClient.get(`/roi/get_overlay?view=${view}&slice_index=${sliceIndex}`, {
    responseType: 'blob',
  });
};

export default {
  processRois,
  getRoiSlice,
  getOverlayImage,
};