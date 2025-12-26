import apiClient from './client';
import type { DocumentList, DocumentUploadResponse } from '../types/document.types';
import type { MessageResponse } from '../types/common.types';

export interface DocumentIndexCheckRequest {
  document_paths: string[];
}

export interface DocumentIndexCheckResponse {
  document_indexes: Record<string, string[]>; // {file_path: [index_names]}
}

export const documentsApi = {
  // Get all documents (FAST - without index information)
  getAll: async (): Promise<DocumentList> => {
    const response = await apiClient.get<DocumentList>('/documents/');
    return response.data;
  },

  // Check which indexes contain documents (separate async call)
  checkIndexes: async (
    documentPaths: string[],
    signal?: AbortSignal
  ): Promise<DocumentIndexCheckResponse> => {
    const response = await apiClient.post<DocumentIndexCheckResponse>(
      '/documents/check-indexes',
      {
        document_paths: documentPaths,
      },
      {
        signal, // Pass abort signal to axios
        timeout: 120000, // 2 minutes timeout (longer than default 60s)
      }
    );
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
