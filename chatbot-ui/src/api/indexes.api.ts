import apiClient from './client';
import type { Index, IndexCreate, IndexList } from '../types/index.types';
import type { MessageResponse } from '../types/common.types';

export const indexesApi = {
  // Get all indexes
  getAll: async (): Promise<IndexList> => {
    const response = await apiClient.get<IndexList>('/indexes/');
    return response.data;
  },

  // Get index by name
  getByName: async (indexName: string): Promise<Index> => {
    const response = await apiClient.get<Index>(`/indexes/${indexName}`);
    return response.data;
  },

  // Create new index
  create: async (data: IndexCreate): Promise<Index> => {
    const response = await apiClient.post<Index>('/indexes/', data);
    return response.data;
  },

  // Delete index
  delete: async (indexName: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/indexes/${indexName}`);
    return response.data;
  },

  // Update index with specific documents
  updateWithDocuments: async (indexName: string, documentPaths: string[]): Promise<Index> => {
    const response = await apiClient.post<Index>(`/indexes/${indexName}/update`, documentPaths);
    return response.data;
  },

  // Update index from directory
  updateFromDirectory: async (indexName: string): Promise<Index> => {
    const response = await apiClient.post<Index>(`/indexes/${indexName}/update-from-directory`);
    return response.data;
  },
};

export default indexesApi;
