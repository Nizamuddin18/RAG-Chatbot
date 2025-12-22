import apiClient from './client';
import type { DocumentList, DocumentUploadResponse } from '../types/document.types';
import type { MessageResponse } from '../types/common.types';

export const documentsApi = {
  // Get all documents
  getAll: async (): Promise<DocumentList> => {
    const response = await apiClient.get<DocumentList>('/documents/');
    return response.data;
  },

  // Upload document
  upload: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<DocumentUploadResponse>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete document
  delete: async (filename: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/documents/${filename}`);
    return response.data;
  },
};

export default documentsApi;
