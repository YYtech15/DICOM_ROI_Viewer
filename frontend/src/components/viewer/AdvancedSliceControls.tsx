import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AdvancedSliceControlsProps {
  sliceIndex: number;
  maxSliceIndex: number;
  onSliceChange: (index: number) => void;
  label?: string;
  showPlayback?: boolean;
}

export default function AdvancedSliceControls({
  sliceIndex,
  maxSliceIndex,
  onSliceChange,
  label = 'Slice',
  showPlayback = true
}: AdvancedSliceControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(200); // ms between frames
  const playbackRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // アニメーション再生のための効果
  useEffect(() => {
    if (isPlaying) {
      let currentIndex = sliceIndex;
      let direction = 1; // 1: forward, -1: backward
      
      const play = () => {
        // 次のスライスへ移動
        currentIndex += direction;
        
        // 端に到達したら方向転換
        if (currentIndex >= maxSliceIndex) {
          currentIndex = maxSliceIndex;
          direction = -1;
        } else if (currentIndex <= 0) {
          currentIndex = 0;
          direction = 1;
        }
        
        onSliceChange(currentIndex);
        playbackRef.current = window.setTimeout(play, playSpeed);
      };
      
      playbackRef.current = window.setTimeout(play, playSpeed);
      
      return () => {
        if (playbackRef.current !== null) {
          clearTimeout(playbackRef.current);
        }
      };
    }
  }, [isPlaying, maxSliceIndex, onSliceChange, playSpeed]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSliceChange(Number(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSliceChange(Math.max(0, sliceIndex - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSliceChange(Math.min(maxSliceIndex, sliceIndex + 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSliceChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSliceChange(maxSliceIndex);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      onSliceChange(Math.max(0, sliceIndex - 10));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      onSliceChange(Math.min(maxSliceIndex, sliceIndex + 10));
    }
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepBackward = () => {
    onSliceChange(Math.max(0, sliceIndex - 1));
  };

  const handleStepForward = () => {
    onSliceChange(Math.min(maxSliceIndex, sliceIndex + 1));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaySpeed(Number(e.target.value));
  };

  // フォーカス時にキーボードショートカットを表示するポップオーバー
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="slice-control" className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm text-gray-500">
          {sliceIndex} / {maxSliceIndex}
        </span>
      </div>
      
      <div className="relative">
        <input
          id="slice-control"
          ref={sliderRef}
          type="range"
          min="0"
          max={maxSliceIndex}
          value={sliceIndex}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowKeyboardHelp(true)}
          onBlur={() => setShowKeyboardHelp(false)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-valuemin={0}
          aria-valuemax={maxSliceIndex}
          aria-valuenow={sliceIndex}
          aria-label={`${label} control, current slice ${sliceIndex} of ${maxSliceIndex}`}
        />
        
        {showKeyboardHelp && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-gray-800 text-white p-2 text-xs rounded z-10 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <span>← → : Move by 1 slice</span>
              <span>Page Up/Down: Move by 10 slices</span>
              <span>Home/End: Jump to first/last slice</span>
            </div>
          </div>
        )}
      </div>
      
      {showPlayback && (
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleStepBackward}
              className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={sliceIndex <= 0}
              aria-label="Previous slice"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handlePlayToggle}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              aria-label={isPlaying ? 'Pause animation' : 'Start animation'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={handleStepForward}
              className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={sliceIndex >= maxSliceIndex}
              aria-label="Next slice"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="play-speed" className="text-xs text-gray-500 mr-1">
              Speed:
            </label>
            <select
              id="play-speed"
              value={playSpeed}
              onChange={handleSpeedChange}
              className="text-xs border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              disabled={!isPlaying}
            >
              <option value="500">Slow</option>
              <option value="200">Normal</option>
              <option value="100">Fast</option>
              <option value="50">Very Fast</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}