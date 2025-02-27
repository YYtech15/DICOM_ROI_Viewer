import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  ArrowUturnLeftIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import useImageControls from '../../hooks/useImageControls';

interface EnhancedImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  viewType: string;
  view: string;
  altText?: string;
  onFullscreen?: () => void;
}

export default function EnhancedImageDisplay({
  imageUrl,
  isLoading,
  viewType,
  view,
  altText = 'Medical image',
  onFullscreen
}: EnhancedImageDisplayProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  
  const {
    zoom,
    position,
    isDragging,
    containerRef,
    handleMouseDown,
    handleMouseLeave,
    zoomIn,
    zoomOut,
    resetZoom
  } = useImageControls({
    maxZoom: 8,
    minZoom: 0.5,
    zoomSpeed: 0.25,
    initialZoom: 1
  });

  useEffect(() => {
    // Reset zoom and position when the view or image changes
    resetZoom();
    setImageError(null);
  }, [view, imageUrl, resetZoom]);

  const handleImageError = () => {
    setImageError('Failed to load image');
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          {view.charAt(0).toUpperCase() + view.slice(1)} View - {viewType}
        </h3>
        <div className="text-xs text-gray-500">
          {zoom !== 1 ? `${(zoom * 100).toFixed(0)}%` : ''}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative h-80 overflow-hidden bg-gray-900 touch-none"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: zoom > 1 ? isDragging ? 'grabbing' : 'grab' : 'default',
          touchAction: 'none' // モバイルでのピンチズームを防止
        }}
        aria-label={`${view} view of ${viewType}`}
        role="img"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <ClipLoader size={40} color="#ffffff" />
          </div>
        ) : imageUrl && !imageError ? (
          <div
            className="absolute inset-0 flex items-center justify-center will-change-transform"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <img
              src={imageUrl}
              alt={altText}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">
              {imageError || 'No image available'}
            </p>
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 flex space-x-1 bg-black bg-opacity-30 rounded-md p-1">
          <button
            onClick={zoomOut}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            disabled={zoom <= 0.5}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={zoomIn}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            disabled={zoom >= 8}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={resetZoom}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            disabled={zoom === 1 && position.x === 0 && position.y === 0}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Fullscreen"
              title="Fullscreen"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ズームレベルインジケータ（一時的に表示） */}
        {zoom !== 1 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {(zoom * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}