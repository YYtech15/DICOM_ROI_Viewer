import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { processRois } from '../../store/slices/roiSlice';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ClipLoader } from 'react-spinners';

interface ROIPanelProps {
  onROIToggle: (index: number, visible: boolean) => void;
}

export default function ROIPanel({ onROIToggle }: ROIPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { niftiFiles } = useSelector((state: RootState) => state.upload);
  const { dicomShape } = useSelector((state: RootState) => state.viewer);
  const { rois, isLoading, error } = useSelector((state: RootState) => state.roi);
  
  const [visibleRois, setVisibleRois] = useState<boolean[]>([]);

  useEffect(() => {
    // Initialize visibility state when ROIs change
    if (rois.length > 0) {
      setVisibleRois(rois.map(() => true));
    }
  }, [rois]);

  useEffect(() => {
    // Process ROIs when DICOM shape is available and NIfTI files are uploaded
    if (dicomShape.length === 3 && niftiFiles.length > 0 && rois.length === 0 && !isLoading) {
      const niftiFilenames = niftiFiles.map((file: any) => 
        file.filename || file.original_filename
      );
      
      dispatch(processRois({
        nifti_files: niftiFilenames,
        dicom_shape: dicomShape
      }));
    }
  }, [dispatch, dicomShape, niftiFiles, rois.length, isLoading]);

  const toggleRoi = (index: number) => {
    const newVisibility = [...visibleRois];
    newVisibility[index] = !newVisibility[index];
    setVisibleRois(newVisibility);
    onROIToggle(index, newVisibility[index]);
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <ClipLoader size={24} color="#4338ca" />
          <p className="text-sm text-gray-500">Processing ROIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rois.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-sm text-gray-500">No ROIs available. Please upload NIfTI files.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Overlays</h3>
      
      <ul className="divide-y divide-gray-200">
        {rois.map((roi, index) => (
          <li key={index} className="py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ 
                  backgroundColor: getRoiColor(index),
                  opacity: visibleRois[index] ? 1 : 0.3
                }}
              />
              <span className="text-sm font-medium text-gray-900">
                {roi.label || `ROI ${index + 1}`}
              </span>
            </div>
            <button
              onClick={() => toggleRoi(index)}
              className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                visibleRois[index] ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {visibleRois[index] ? (
                <EyeIcon className="h-5 w-5" />
              ) : (
                <EyeSlashIcon className="h-5 w-5" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper function to get a color for an ROI based on its index
function getRoiColor(index: number): string {
  const colors = [
    '#ef4444', // Red
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#8b5cf6', // Purple
    '#14b8a6', // Teal
    '#f59e0b', // Amber
  ];
  
  return colors[index % colors.length];
}