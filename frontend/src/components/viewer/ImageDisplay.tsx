import React, { useState, useRef, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  viewType: string;
  view: string;
  altText?: string;
}

export default function ImageDisplay({
  imageUrl,
  isLoading,
  viewType,
  view,
  altText = 'Medical image'
}: ImageDisplayProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset zoom and position when the view or image changes
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [view, imageUrl]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.1, 5));
    } else {
      setZoom(prev => Math.max(prev - 0.1, 0.5));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">
          {view.charAt(0).toUpperCase() + view.slice(1)} View - {viewType}
        </h3>
      </div>
      
      <div 
        ref={containerRef}
        className="relative h-80 overflow-hidden bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? 'move' : 'default' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <ClipLoader size={40} color="#ffffff" />
          </div>
        ) : imageUrl ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <img
              src={imageUrl}
              alt={altText}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">No image available</p>
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none"
            disabled={zoom <= 0.5}
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none"
            disabled={zoom >= 5}
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded-full bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-75 focus:outline-none"
            disabled={zoom === 1 && position.x === 0 && position.y === 0}
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}