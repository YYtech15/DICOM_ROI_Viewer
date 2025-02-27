import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { listUploadedFiles } from '../store/slices/uploadSlice';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { dicomFiles, niftiFiles } = useSelector((state: RootState) => state.upload);

  useEffect(() => {
    dispatch(listUploadedFiles());
  }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to the DICOM+ROI Viewer application.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Uploaded DICOM Files
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {dicomFiles.length} files uploaded
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {dicomFiles.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {dicomFiles.slice(0, 5).map((file, index) => (
                    <li key={index} className="py-2">
                      <p className="text-sm text-gray-800 truncate">
                        {file.original_filename}
                      </p>
                    </li>
                  ))}
                  {dicomFiles.length > 5 && (
                    <li className="py-2 text-sm text-gray-500">
                      And {dicomFiles.length - 5} more files...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No DICOM files uploaded yet.</p>
              )}
              <div className="mt-4">
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Upload DICOM Files
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Uploaded NIfTI Files
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {niftiFiles.length} files uploaded
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {niftiFiles.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {niftiFiles.slice(0, 5).map((file, index) => (
                    <li key={index} className="py-2">
                      <p className="text-sm text-gray-800 truncate">
                        {file.original_filename}
                      </p>
                    </li>
                  ))}
                  {niftiFiles.length > 5 && (
                    <li className="py-2 text-sm text-gray-500">
                      And {niftiFiles.length - 5} more files...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No NIfTI files uploaded yet.</p>
              )}
              <div className="mt-4">
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Upload NIfTI Files
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dicomFiles.length > 0 && niftiFiles.length > 0 && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Ready to View Images
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                You have both DICOM and NIfTI files uploaded. Start viewing now!
              </p>
            </div>
            <Link
              to="/viewer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Open Viewer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}