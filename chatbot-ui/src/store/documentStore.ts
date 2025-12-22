import { create } from 'zustand';
import type { Document } from '../types/document.types';
import documentsApi from '../api/documents.api';
import { handleApiError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;

  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<Document | null>;
  deleteDocument: (filename: string) => Promise<boolean>;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await documentsApi.getAll();
      set({ documents: data.documents, isLoading: false });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  uploadDocument: async (file: File) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });
    try {
      const newDocument = await documentsApi.upload(file);
      set((state) => ({
        documents: [...state.documents, newDocument],
        isLoading: false,
        uploadProgress: 100,
      }));
      toast.success(`Document "${file.name}" uploaded successfully`);
      return newDocument;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false, uploadProgress: 0 });
      toast.error(errorMessage);
      return null;
    }
  },

  deleteDocument: async (filename: string) => {
    set({ isLoading: true, error: null });
    try {
      await documentsApi.delete(filename);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.filename !== filename),
        isLoading: false,
      }));
      toast.success('Document deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
