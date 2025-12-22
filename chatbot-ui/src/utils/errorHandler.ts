import axios, { AxiosError } from 'axios';
import type { ErrorResponse } from '../types/common.types';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    if (axiosError.response) {
      // Server responded with error status
      const data = axiosError.response.data;
      if (data && typeof data === 'object' && 'detail' in data) {
        return data.detail;
      }
      return axiosError.message || 'An error occurred';
    } else if (axiosError.request) {
      // Request made but no response
      return 'No response from server. Please check your connection.';
    }
  }

  // Unknown error type
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};
