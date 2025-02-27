import { ClipLoader } from 'react-spinners';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
        <ClipLoader size={50} color="#4338ca" />
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}