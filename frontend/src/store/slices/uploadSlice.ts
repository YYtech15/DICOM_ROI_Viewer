import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import uploadService from '../../services/uploadService';

interface UploadState {
  dicomFiles: FileInfo[];
  niftiFiles: FileInfo[];
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

interface FileInfo {
  original_filename: string;
  saved_filename: string;
  path: string;
}

interface UploadResponse {
  status: string;
  files: FileInfo[];
  count: number;
}

const initialState: UploadState = {
  dicomFiles: [],
  niftiFiles: [],
  isUploading: false,
  uploadProgress: 0,
  error: null,
};

export const uploadDicomFiles = createAsyncThunk(
  'upload/dicom',
  async (files: File[], { rejectWithValue }) => {
    try {
      const response = await uploadService.uploadDicomFiles(files);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload DICOM files');
    }
  }
);

export const uploadNiftiFiles = createAsyncThunk(
  'upload/nifti',
  async (files: File[], { rejectWithValue }) => {
    try {
      const response = await uploadService.uploadNiftiFiles(files);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to upload NIfTI files');
    }
  }
);

export const listUploadedFiles = createAsyncThunk(
  'upload/list',
  async (_, { rejectWithValue }) => {
    try {
      const response = await uploadService.listUploadedFiles();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to list uploaded files');
    }
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearUploadError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Upload DICOM files
    builder.addCase(uploadDicomFiles.pending, (state) => {
      state.isUploading = true;
      state.uploadProgress = 0;
      state.error = null;
    });
    builder.addCase(uploadDicomFiles.fulfilled, (state, action: PayloadAction<UploadResponse>) => {
      state.isUploading = false;
      state.uploadProgress = 100;
      state.dicomFiles = action.payload.files;
      toast.success(`Successfully uploaded ${action.payload.count} DICOM files`);
    });
    builder.addCase(uploadDicomFiles.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
    
    // Upload NIfTI files
    builder.addCase(uploadNiftiFiles.pending, (state) => {
      state.isUploading = true;
      state.uploadProgress = 0;
      state.error = null;
    });
    builder.addCase(uploadNiftiFiles.fulfilled, (state, action: PayloadAction<UploadResponse>) => {
      state.isUploading = false;
      state.uploadProgress = 100;
      state.niftiFiles = action.payload.files;
      toast.success(`Successfully uploaded ${action.payload.count} NIfTI files`);
    });
    builder.addCase(uploadNiftiFiles.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });
    
    // List uploaded files
    builder.addCase(listUploadedFiles.fulfilled, (state, action: PayloadAction<any>) => {
      const { dicom, nifti } = action.payload.files;
      state.dicomFiles = dicom.map((filename: string) => ({ 
        original_filename: filename,
        saved_filename: filename,
        path: filename
      }));
      state.niftiFiles = nifti.map((filename: string) => ({ 
        original_filename: filename,
        saved_filename: filename,
        path: filename
      }));
    });
  },
});

export const { setUploadProgress, clearUploadError } = uploadSlice.actions;
export default uploadSlice.reducer;