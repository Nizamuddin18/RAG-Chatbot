import { create } from 'zustand';
import type { Index, IndexCreate } from '../types/index.types';
import indexesApi from '../api/indexes.api';
import { handleApiError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface IndexStore {
  indexes: Index[];
  selectedIndex: Index | null;
  isLoading: boolean;
  error: string | null;

  fetchIndexes: () => Promise<void>;
  createIndex: (data: IndexCreate) => Promise<Index | null>;
  deleteIndex: (indexName: string) => Promise<boolean>;
  updateIndexWithDocuments: (indexName: string, documentPaths: string[]) => Promise<Index | null>;
  updateIndexFromDirectory: (indexName: string) => Promise<Index | null>;
  setSelectedIndex: (index: Index | null) => void;
  clearError: () => void;
}

export const useIndexStore = create<IndexStore>((set) => ({
  indexes: [],
  selectedIndex: null,
  isLoading: false,
  error: null,

  fetchIndexes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await indexesApi.getAll();
      set({ indexes: data.indexes, isLoading: false });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createIndex: async (data: IndexCreate) => {
    set({ isLoading: true, error: null });
    try {
      const newIndex = await indexesApi.create(data);
      set((state) => ({
        indexes: [...state.indexes, newIndex],
        isLoading: false,
      }));
      toast.success('Index created successfully');
      return newIndex;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  deleteIndex: async (indexName: string) => {
    set({ isLoading: true, error: null });
    try {
      await indexesApi.delete(indexName);
      set((state) => ({
        indexes: state.indexes.filter((index) => index.name !== indexName),
        selectedIndex:
          state.selectedIndex?.name === indexName ? null : state.selectedIndex,
        isLoading: false,
      }));
      toast.success('Index deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  updateIndexWithDocuments: async (indexName: string, documentPaths: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const updatedIndex = await indexesApi.updateWithDocuments(indexName, documentPaths);
      set((state) => ({
        indexes: state.indexes.map((index) =>
          index.name === indexName ? updatedIndex : index
        ),
        isLoading: false,
      }));
      toast.success(`Index "${indexName}" updated with ${documentPaths.length} document(s)`);
      return updatedIndex;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  updateIndexFromDirectory: async (indexName: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedIndex = await indexesApi.updateFromDirectory(indexName);
      set((state) => ({
        indexes: state.indexes.map((index) =>
          index.name === indexName ? updatedIndex : index
        ),
        isLoading: false,
      }));
      toast.success(`Index "${indexName}" updated from directory`);
      return updatedIndex;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  setSelectedIndex: (index: Index | null) => {
    set({ selectedIndex: index });
  },

  clearError: () => {
    set({ error: null });
  },
}));
