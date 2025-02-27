import httpClient from './httpClient';

const uploadDicomFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  return httpClient.post('/upload/dicom', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const uploadNiftiFiles = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  return httpClient.post('/upload/nifti', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const listUploadedFiles = () => {
  return httpClient.get('/upload/list');
};

export default {
  uploadDicomFiles,
  uploadNiftiFiles,
  listUploadedFiles,
};