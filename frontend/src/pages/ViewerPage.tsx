import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { loadDicomData, setActiveView, setSliceIndex, setWindowSettings } from '../store/slices/viewerSlice';
import { listUploadedFiles } from '../store/slices/uploadSlice';
import { ClipLoader } from 'react-spinners';
import EnhancedImageDisplay from '../components/viewer/EnhancedImageDisplay';
import AdvancedSliceControls from '../components/viewer/AdvancedSliceControls';
import ROIPanel from '../components/viewer/ROIPanel';
import ShortcutsHelp from '../components/common/ShortcutsHelp';
import FeedbackButton from '../components/feedback/FeedbackButton';
import ResponsiveContainer from '../components/layout/ResponsiveContainer';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import usePreloadedImages from '../hooks/usePreloadedImages';
import httpClient from '../services/httpClient';
import { Toaster } from 'react-hot-toast';

export default function ViewerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const uploadState = useSelector((state: RootState) => state.upload);
  const { dicomFiles, niftiFiles } = uploadState;
  const { 
    dicomShape, 
    activeView, 
    sliceIndex, 
    windowSettings,
    isLoading, 
    error 
  } = useSelector((state: RootState) => state.viewer);
  
  const [visibleRois, setVisibleRois] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // 表示するビュータイプ
  const viewTypes = ['dicom', 'combined'];
  
  // 現在のビューの最大スライスインデックス
  const maxSliceIndex = activeView === 'axial'
    ? dicomShape[0] - 1
    : activeView === 'coronal'
    ? dicomShape[1] - 1
    : dicomShape[2] - 1;

  // 画像のベースURL
  const dicomImageBaseUrl = `/api/viewer/get_slice?view=${activeView}
    &window_center=${windowSettings.center}
    &window_width=${windowSettings.width}`;
  
  const combinedImageBaseUrl = `/api/viewer/get_combined_view?view=${activeView}
    &window_center=${windowSettings.center}
    &window_width=${windowSettings.width}
    ${visibleRois.length > 0 ? `&visible_rois=${visibleRois.join(',')}` : ''}`;

  // 画像のプリロード
  const { 
    currentImageUrl: dicomImageUrl, 
    isLoading: isDicomLoading 
  } = usePreloadedImages(dicomImageBaseUrl, sliceIndex[activeView], maxSliceIndex);
  
  const { 
    currentImageUrl: combinedImageUrl, 
    isLoading: isCombinedLoading 
  } = usePreloadedImages(combinedImageBaseUrl, sliceIndex[activeView], maxSliceIndex);

  // キーボードショートカットの設定
  const shortcuts = [
    {
      key: 'ArrowLeft',
      action: () => handleSliceChange(Math.max(0, sliceIndex[activeView] - 1)),
      description: 'Previous slice'
    },
    {
      key: 'ArrowRight',
      action: () => handleSliceChange(Math.min(maxSliceIndex, sliceIndex[activeView] + 1)),
      description: 'Next slice'
    },
    {
      key: 'Home',
      action: () => handleSliceChange(0),
      description: 'First slice'
    },
    {
      key: 'End',
      action: () => handleSliceChange(maxSliceIndex),
      description: 'Last slice'
    },
    {
      key: '1',
      action: () => handleViewChange('axial'),
      description: 'Axial view'
    },
    {
      key: '2',
      action: () => handleViewChange('coronal'),
      description: 'Coronal view'
    },
    {
      key: '3',
      action: () => handleViewChange('sagittal'),
      description: 'Sagittal view'
    },
    {
      key: 'r',
      action: handleReset,
      description: 'Reset view settings'
    },
    {
      key: '?',
      action: () => {/* ShortcutsHelp コンポーネントで対応 */},
      description: 'Show keyboard shortcuts'
    }
  ];
  
  const { getShortcutHelpText } = useKeyboardShortcuts(shortcuts);

  // データの読み込み
  useEffect(() => {
    if (dicomFiles.length === 0 || niftiFiles.length === 0) {
      dispatch(listUploadedFiles());
    } else if (dicomShape.length === 0 && !isLoading) {
      dispatch(loadDicomData());
    }
  }, [dispatch, dicomFiles.length, niftiFiles.length, dicomShape, isLoading]);

  // スライスインデックスの範囲チェック
  useEffect(() => {
    if (dicomShape.length === 3) {
      const currentMax = activeView === 'axial'
        ? dicomShape[0] - 1
        : activeView === 'coronal'
        ? dicomShape[1] - 1
        : dicomShape[2] - 1;
      
      if (sliceIndex[activeView] > currentMax) {
        dispatch(setSliceIndex({ 
          view: activeView, 
          index: Math.floor(currentMax / 2) 
        }));
      }
    }
  }, [dispatch, dicomShape, activeView, sliceIndex]);

  const handleViewChange = (view: string) => {
    dispatch(setActiveView(view as 'axial' | 'coronal' | 'sagittal'));
  };

  const handleSliceChange = (index: number) => {
    dispatch(setSliceIndex({ view: activeView, index }));
  };

  const handleWindowChange = (center: number, width: number) => {
    dispatch(setWindowSettings({ center, width }));
  };

  const handleReset = () => {
    dispatch(setWindowSettings({ center: 40, width: 400 }));
  };

  const handleRoiToggle = (roiIndex: number, visible: boolean) => {
    if (visible) {
      setVisibleRois(prev => [...prev, roiIndex]);
    } else {
      setVisibleRois(prev => prev.filter(idx => idx !== roiIndex));
    }
  };

  const handleFullscreen = (imageUrl: string | null) => {
    if (imageUrl) {
      setFullscreenImage(imageUrl);
      setIsFullscreen(true);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  const fetchUploadList = async () => {
    try {
      const response = await httpClient.get('/upload/list');
      if (response.data) {
        dispatch(listUploadedFiles(response.data));
      }
    } catch (error) {
      console.error('Error fetching upload list:', error);
      toast.error('Failed to fetch upload list');
    }
  };

  useEffect(() => {
    fetchUploadList();
  }, [dispatch]);

  if (dicomFiles.length === 0 || niftiFiles.length === 0) {
    return (
      <ResponsiveContainer>
        <div className="bg-white shadow rounded-lg p-8 text-center my-8">
          <p className="text-lg text-gray-600 mb-4">
            You need to upload both DICOM and NIfTI files to use the viewer.
          </p>
          
          <a>
            href="/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            Go to Upload Page
          </a>
        </div>
      </ResponsiveContainer>
    );
  }

  if (isLoading) {
    return (
      <ResponsiveContainer>
        <div className="flex justify-center items-center h-64 my-8">
          <ClipLoader size={50} color="#4338ca" />
          <p className="ml-4 text-lg text-gray-600">Loading data...</p>
        </div>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-lg font-medium text-red-800">Error loading data</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (dicomShape.length === 0) {
    return (
      <ResponsiveContainer>
        <div className="bg-white shadow rounded-lg p-8 text-center my-8">
        <p className="text-lg text-gray-600">No data available. Please upload files first.</p>
       </div>
     </ResponsiveContainer>
   );
 }

 return (
   <ResponsiveContainer>
     <div className="py-6">
       <div className="flex flex-wrap justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-gray-900">
           DICOM + ROI Viewer
         </h1>
         <div className="flex items-center space-x-2 mt-2 sm:mt-0">
           <div className="inline-flex rounded-md shadow-sm" role="group">
             <button
               onClick={() => handleViewChange('axial')}
               className={`px-4 py-2 text-sm font-medium ${
                 activeView === 'axial'
                   ? 'bg-primary-600 text-white'
                   : 'bg-white text-gray-700 hover:bg-gray-50'
               } border border-gray-300 rounded-l-md focus:z-10 focus:ring-2 focus:ring-primary-500 focus:text-primary-600`}
             >
               Axial
             </button>
             <button
               onClick={() => handleViewChange('coronal')}
               className={`px-4 py-2 text-sm font-medium ${
                 activeView === 'coronal'
                   ? 'bg-primary-600 text-white'
                   : 'bg-white text-gray-700 hover:bg-gray-50'
               } border-t border-b border-gray-300 focus:z-10 focus:ring-2 focus:ring-primary-500 focus:text-primary-600`}
             >
               Coronal
             </button>
             <button
               onClick={() => handleViewChange('sagittal')}
               className={`px-4 py-2 text-sm font-medium ${
                 activeView === 'sagittal'
                   ? 'bg-primary-600 text-white'
                   : 'bg-white text-gray-700 hover:bg-gray-50'
               } border border-gray-300 rounded-r-md focus:z-10 focus:ring-2 focus:ring-primary-500 focus:text-primary-600`}
             >
               Sagittal
             </button>
           </div>
           <ShortcutsHelp shortcuts={getShortcutHelpText()} />
         </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
           <ResponsiveGrid columns={2} gap="medium">
             <EnhancedImageDisplay
               imageUrl={dicomImageUrl}
               isLoading={isDicomLoading}
               viewType="DICOM"
               view={activeView}
               altText={`${activeView} DICOM slice`}
               onFullscreen={() => handleFullscreen(dicomImageUrl)}
             />
             <EnhancedImageDisplay
               imageUrl={combinedImageUrl}
               isLoading={isCombinedLoading}
               viewType="Combined View"
               view={activeView}
               altText={`${activeView} combined view`}
               onFullscreen={() => handleFullscreen(combinedImageUrl)}
             />
           </ResponsiveGrid>
           
           <div className="bg-white shadow rounded-lg p-4">
             <div className="mb-4">
               <AdvancedSliceControls 
                 sliceIndex={sliceIndex[activeView]}
                 maxSliceIndex={maxSliceIndex}
                 onSliceChange={handleSliceChange}
                 label={`${activeView.charAt(0).toUpperCase() + activeView.slice(1)} Slice`}
               />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <div>
                 <h4 className="text-sm font-medium text-gray-500 mb-2">Window Center</h4>
                 <input
                   type="range"
                   min="-1000"
                   max="3000"
                   value={windowSettings.center}
                   onChange={(e) => handleWindowChange(parseInt(e.target.value), windowSettings.width)}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between mt-1">
                   <span className="text-xs text-gray-500">-1000</span>
                   <span className="text-xs font-medium text-gray-700">{windowSettings.center}</span>
                   <span className="text-xs text-gray-500">3000</span>
                 </div>
               </div>
               
               <div>
                 <h4 className="text-sm font-medium text-gray-500 mb-2">Window Width</h4>
                 <input
                   type="range"
                   min="1"
                   max="4000"
                   value={windowSettings.width}
                   onChange={(e) => handleWindowChange(windowSettings.center, parseInt(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between mt-1">
                   <span className="text-xs text-gray-500">1</span>
                   <span className="text-xs font-medium text-gray-700">{windowSettings.width}</span>
                   <span className="text-xs text-gray-500">4000</span>
                 </div>
               </div>
             </div>
             
             <div className="mt-4 flex justify-center">
               <button
                 onClick={handleReset}
                 className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
               >
                 Reset Window Settings
               </button>
             </div>
           </div>
           
           <div className="bg-white shadow rounded-lg p-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900">Volume Information</h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <h4 className="text-sm font-medium text-gray-500">DICOM Volume</h4>
                 <p className="mt-1 text-sm text-gray-900">Dimensions: {dicomShape.join(' × ')}</p>
                 <p className="mt-1 text-sm text-gray-900">
                   Current Slice: {sliceIndex[activeView]} / {maxSliceIndex}
                 </p>
               </div>
               <div>
                 <h4 className="text-sm font-medium text-gray-500">Window Settings</h4>
                 <p className="mt-1 text-sm text-gray-900">Center: {windowSettings.center}</p>
                 <p className="mt-1 text-sm text-gray-900">Width: {windowSettings.width}</p>
               </div>
             </div>
           </div>
         </div>
         
         <div className="space-y-6">
           <ROIPanel
             onROIToggle={handleRoiToggle}
           />
           
           <div className="bg-white shadow rounded-lg p-4">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Keyboard Shortcuts</h3>
             <div className="space-y-2 text-sm">
               <p><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">→</span> / <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">←</span> : Next/Previous slice</p>
               <p><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Home</span> / <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">End</span> : First/Last slice</p>
               <p><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">1</span> / <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">2</span> / <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">3</span> : Switch views</p>
               <p><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">R</span> : Reset window settings</p>
               <p><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">?</span> : Show all shortcuts</p>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* フィードバックボタン */}
     <FeedbackButton />
     
     {/* フルスクリーン画像モーダル */}
     {isFullscreen && fullscreenImage && (
       <div 
         className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
         onClick={closeFullscreen}
       >
         <div 
           className="max-w-full max-h-full p-4"
           onClick={(e) => e.stopPropagation()}
         >
           <img 
             src={fullscreenImage} 
             alt="Fullscreen view" 
             className="max-w-full max-h-[90vh] object-contain"
           />
           <button
             onClick={closeFullscreen}
             className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 focus:outline-none"
             aria-label="Close fullscreen view"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </div>
       </div>
     )}
   </ResponsiveContainer>
 );
}