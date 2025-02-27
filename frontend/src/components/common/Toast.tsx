import React from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const Toast = {
  show({ 
    message, 
    type = 'info', 
    duration = 3000, 
    position = 'top-right' 
  }: ToastProps) {
    const options: ToastOptions = {
      position,
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    const content = (
      <div className="flex items-center">
        {type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
        {type === 'error' && <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />}
        {type === 'info' && <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />}
        {type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />}
        <span className="text-sm">{message}</span>
      </div>
    );

    switch (type) {
      case 'success':
        toast.success(content, options);
        break;
      case 'error':
        toast.error(content, options);
        break;
      case 'info':
        toast.info(content, options);
        break;
      case 'warning':
        toast.warning(content, options);
        break;
      default:
        toast(content, options);
    }
  },

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  },

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  },

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  },

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }
};

export default Toast;