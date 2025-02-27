import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import viewerService from '../../services/viewerService';

interface ViewerState {
  dicomMetadata: any | null;
  dicomShape: number[];
  activeView: 'axial' | 'coronal' | 'sagittal';
  sliceIndex: { axial: number; coronal: number; sagittal: number };
  windowSettings: { center: number; width: number };
  isLoading: boolean;
  error: string | null;
}

const initialState: ViewerState = {
  dicomMetadata: null,
  dicomShape: [],
  activeView: 'axial',
  sliceIndex: { axial: 0, coronal: 0, sagittal: 0 },
  windowSettings: { center: 40, width: 400 },
  isLoading: false,
  error: null,
};

export const loadDicomData = createAsyncThunk(
  'viewer/loadDicom',
  async (_, { rejectWithValue }) => {
    try {
      const response = await viewerService.loadDicom();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to load DICOM data');
    }
  }
);

export const getMetadata = createAsyncThunk(
  'viewer/getMetadata',
  async (_, { rejectWithValue }) => {
    try {
      const response = await viewerService.getMetadata();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get metadata');
    }
  }
);

const viewerSlice = createSlice({
  name: 'viewer',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<'axial' | 'coronal' | 'sagittal'>) => {
      state.activeView = action.payload;
    },
    setSliceIndex: (state, action: PayloadAction<{ view: 'axial' | 'coronal' | 'sagittal'; index: number }>) => {
      state.sliceIndex[action.payload.view] = action.payload.index;
    },
    setWindowSettings: (state, action: PayloadAction<{ center: number; width: number }>) => {
      state.windowSettings = action.payload;
    },
    resetWindowSettings: (state) => {
      state.windowSettings = { center: 40, width: 400 };
    },
    clearViewerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load DICOM data
    builder.addCase(loadDicomData.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadDicomData.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.dicomShape = action.payload.dicom_shape;
      state.dicomMetadata = action.payload.dicom_metadata;
      
      // Initialize slice indices to middle slices
      state.sliceIndex = {
        axial: Math.floor(action.payload.dicom_shape[0] / 2),
        coronal: Math.floor(action.payload.dicom_shape[1] / 2),
        sagittal: Math.floor(action.payload.dicom_shape[2] / 2),
      };
      
      // Set window settings from metadata if available
      if (action.payload.dicom_metadata) {
        const center = action.payload.dicom_metadata.WindowCenter;
        const width = action.payload.dicom_metadata.WindowWidth;
        if (center !== undefined && width !== undefined) {
          state.windowSettings = { center, width };
        }
      }
      
      toast.success('DICOM data loaded successfully');
    });
    builder.addCase(loadDicomData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
    
    // Get metadata
    builder.addCase(getMetadata.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getMetadata.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.dicomMetadata = action.payload.dicom_metadata;
      if (action.payload.dicom_shape) {
        state.dicomShape = action.payload.dicom_shape;
      }
    });
    builder.addCase(getMetadata.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
  },
});

export const { 
  setActiveView, 
  setSliceIndex, 
  setWindowSettings, 
  resetWindowSettings, 
  clearViewerError 
} = viewerSlice.actions;
export default viewerSlice.reducer;