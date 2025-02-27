import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import roiService from '../../services/roiService';

interface ROIInfo {
  filename: string;
  label: string;
  unique_values: number[];
  shape: number[];
}

interface ROIState {
  rois: ROIInfo[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ROIState = {
  rois: [],
  isLoading: false,
  error: null,
};

export const processRois = createAsyncThunk(
  'roi/process',
  async (data: { nifti_files: string[]; dicom_shape: number[] }, { rejectWithValue }) => {
    try {
      const response = await roiService.processRois(data.nifti_files, data.dicom_shape);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process ROI files');
    }
  }
);

const roiSlice = createSlice({
  name: 'roi',
  initialState,
  reducers: {
    clearRois: (state) => {
      state.rois = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Process ROIs
    builder.addCase(processRois.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(processRois.fulfilled, (state, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.rois = action.payload.roi_info;
      toast.success(`Successfully processed ${state.rois.length} ROI files`);
    });
    builder.addCase(processRois.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
  },
});

export const { clearRois } = roiSlice.actions;
export default roiSlice.reducer;