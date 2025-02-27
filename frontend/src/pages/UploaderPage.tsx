import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { listUploadedFiles } from '../store/slices/uploadSlice';
import { Link } from 'react-router-dom';
import FileUploader from '../components/uploader/FileUploader';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function UploaderPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { dicomFiles, niftiFiles } = useSelector((state: RootState) => state.upload);
  const [activeTab, setActiveTab] = useState<'dicom' | 'nifti'>('dicom');

  useEffect(() => {
    dispatch(listUploadedFiles());
  }, [dispatch]);

  const handleUploaded = () => {
    dispatch(listUploadedFiles());
  };

  return (
    <div>
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                File Upload
              </h2>
            </div>
            <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
              <Link
                to="/viewer"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Viewer
                <ChevronRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:hidden">
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'dicom' | 'nifti')}
          >
            <option value="dicom">DICOM Files</option>
            <option value="nifti">NIfTI Files</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dicom')}
                className={`${
                  activeTab === 'dicom'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                DICOM Files
              </button>
              <button
                onClick={() => setActiveTab('nifti')}
                className={`${
                  activeTab === 'nifti'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                NIfTI Files
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'dicom' ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900">DICOM Files</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your DICOM series files. These will be processed to create a 3D volume.
            </p>
            
            <div className="mt-4">
              <FileUploader type="dicom" onUploaded={handleUploaded} />
            </div>
            
            {Array.isArray(dicomFiles) && dicomFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900">Uploaded DICOM Files</h4>
                <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {dicomFiles.slice(0, 6).map((file: any, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.filename || file.original_filename}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {dicomFiles.length > 6 && (
                  <p className="mt-3 text-sm text-gray-500">
                    And {dicomFiles.length - 6} more files...
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900">NIfTI Files</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your NIfTI files containing ROI segmentations. These will be overlaid on the DICOM volume.
            </p>
            
            <div className="mt-4">
              <FileUploader type="nifti" onUploaded={handleUploaded} />
            </div>
            
            {Array.isArray(niftiFiles) && niftiFiles.length > 0 && (
              <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900">Uploaded NIfTI Files</h4>
              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {niftiFiles.slice(0, 6).map((file: any, index) => (
                  <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename || file.original_filename}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {file.label ? `Label: ${file.label}` : ''}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {niftiFiles.length > 6 && (
                <p className="mt-3 text-sm text-gray-500">
                  And {niftiFiles.length - 6} more files...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    {dicomFiles.length > 0 && niftiFiles.length > 0 && (
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Ready to View Images
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              You've successfully uploaded both DICOM and NIfTI files. 
              You can now proceed to the viewer to visualize your data.
            </p>
          </div>
          <div className="mt-5">
            <Link
              to="/viewer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Open Viewer
            </Link>
          </div>
        </div>
      </div>
    )}
  </div>
);
}