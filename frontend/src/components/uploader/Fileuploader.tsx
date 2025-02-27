import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ClipLoader } from 'react-spinners';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { uploadDicomFiles, uploadNiftiFiles } from '../../store/slices/uploadSlice';

interface FileUploaderProps {
  type: 'dicom' | 'nifti';
  onUploaded?: (result: any) => void;
}

export default function FileUploader({ type, onUploaded }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const dispatch = useDispatch<AppDispatch>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: type === 'dicom' 
      ? { 'application/dicom': ['.dcm'] } 
      : { 'application/octet-stream': ['.nii', '.nii.gz'] }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const action = type === 'dicom' 
        ? await dispatch(uploadDicomFiles(files))
        : await dispatch(uploadNiftiFiles(files));
      
      if (uploadDicomFiles.fulfilled.match(action) || uploadNiftiFiles.fulfilled.match(action)) {
        setFiles([]);
        setUploadProgress(100);
        
        if (onUploaded) {
          onUploaded(action.payload);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            Drag & drop {type.toUpperCase()} files here, or click to select files
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {type === 'dicom' 
              ? 'DICOM files (.dcm)'
              : 'NIfTI files (.nii, .nii.gz)'}
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
          
          <div className="px-4 py-3 bg-gray-50 text-right">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isUploading ? (
                <>
                  <ClipLoader size={18} color="#ffffff" className="mr-2" />
                  Uploading...
                </>
              ) : (
                `Upload ${files.length} files`
              )}
            </button>
          </div>
          
          {isUploading && (
            <div className="px-4 pb-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-right text-gray-500">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}