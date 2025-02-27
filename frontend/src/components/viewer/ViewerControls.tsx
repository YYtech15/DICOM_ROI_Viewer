import React, { useState } from 'react';
import { ViewfinderCircleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';

interface ViewerControlsProps {
  view: string;
  sliceIndex: number;
  maxSliceIndex: number;
  windowCenter: number;
  windowWidth: number;
  onViewChange: (view: string) => void;
  onSliceChange: (index: number) => void;
  onWindowChange: (center: number, width: number) => void;
  onReset: () => void;
}

export default function ViewerControls({
  view,
  sliceIndex,
  maxSliceIndex,
  windowCenter,
  windowWidth,
  onViewChange,
  onSliceChange,
  onWindowChange,
  onReset,
}: ViewerControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewChange = (newView: string) => {
    onViewChange(newView);
  };

  const handleSliceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSliceChange(Number(e.target.value));
  };

  const handleCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWindowChange(Number(e.target.value), windowWidth);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWindowChange(windowCenter, Number(e.target.value));
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Viewer Controls</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {isExpanded ? (
            <ArrowsPointingInIcon className="h-5 w-5" />
          ) : (
            <ArrowsPointingOutIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleViewChange('axial')}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                view === 'axial'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Axial
            </button>
            <button
              onClick={() => handleViewChange('coronal')}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                view === 'coronal'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Coronal
            </button>
            <button
              onClick={() => handleViewChange('sagittal')}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                view === 'sagittal'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Sagittal
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="slice-slider" className="block text-sm font-medium text-gray-700">
              Slice
            </label>
            <span className="text-sm text-gray-500">
              {sliceIndex} / {maxSliceIndex}
            </span>
          </div>
          <input
            id="slice-slider"
            type="range"
            min="0"
            max={maxSliceIndex}
            value={sliceIndex}
            onChange={handleSliceChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {isExpanded && (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="window-center" className="block text-sm font-medium text-gray-700">
                  Window Center
                </label>
                <span className="text-sm text-gray-500">{windowCenter}</span>
              </div>
              <input
                id="window-center"
                type="range"
                min="-1000"
                max="3000"
                value={windowCenter}
                onChange={handleCenterChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="window-width" className="block text-sm font-medium text-gray-700">
                  Window Width
                </label>
                <span className="text-sm text-gray-500">{windowWidth}</span>
              </div>
              <input
                id="window-width"
                type="range"
                min="1"
                max="4000"
                value={windowWidth}
                onChange={handleWidthChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <button
                onClick={onReset}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Reset to Default
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}