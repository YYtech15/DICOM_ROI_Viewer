import httpClient from './httpClient';

const loadDicom = () => {
  return httpClient.post('/viewer/load_dicom');
};

const getSlice = (view: string, sliceIndex: number, windowCenter?: number, windowWidth?: number) => {
  let url = `/viewer/get_slice?view=${view}&slice_index=${sliceIndex}`;
  
  if (windowCenter !== undefined) {
    url += `&window_center=${windowCenter}`;
  }
  
  if (windowWidth !== undefined) {
    url += `&window_width=${windowWidth}`;
  }
  
  return httpClient.get(url, {
    responseType: 'blob',
  });
};

const getCombinedView = (
  view: string, 
  sliceIndex: number, 
  windowCenter?: number, 
  windowWidth?: number,
  visibleRois?: number[]
) => {
  let url = `/viewer/get_combined_view?view=${view}&slice_index=${sliceIndex}`;
  
  if (windowCenter !== undefined) {
    url += `&window_center=${windowCenter}`;
  }
  
  if (windowWidth !== undefined) {
    url += `&window_width=${windowWidth}`;
  }
  
  if (visibleRois && visibleRois.length > 0) {
    url += `&visible_rois=${visibleRois.join(',')}`;
  }
  
  return httpClient.get(url, {
    responseType: 'blob',
  });
};

const getMetadata = () => {
  return httpClient.get('/viewer/get_metadata');
};

export default {
  loadDicom,
  getSlice,
  getCombinedView,
  getMetadata,
};