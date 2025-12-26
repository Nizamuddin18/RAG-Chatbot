import { create } from 'zustand';
import type { Document } from '../types/document.types';
import documentsApi from '../api/documents.api';
import { handleApiError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  isLoadingIndexes: boolean; // Separate loading state for index checks
  error: string | null;
  uploadProgress: number;
  _indexCheckAbortController: AbortController | null; // For cancelling index checks

  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<Document | null>;
  deleteDocument: (filename: string) => Promise<boolean>;
  cancelIndexCheck: () => void; // Cancel ongoing index check
  clearError: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  isLoadingIndexes: false,
  error: null,
  uploadProgress: 0,
  _indexCheckAbortController: null,

  fetchDocuments: async () => {
    // Cancel any ongoing index check from previous call
    const state = get();
    if (state._indexCheckAbortController) {
      console.log('[Document Store] Cancelling previous index check');
      state._indexCheckAbortController.abort();
    }

    set({ isLoading: true, error: null });
    try {
      // Step 1: Fetch documents quickly (without index information)
      console.log('[Document Store] Fetching document list');
      const data = await documentsApi.getAll();
      set({ documents: data.documents, isLoading: false });
      console.log(`[Document Store] Fetched ${data.documents.length} documents`);

      // Step 2: Fetch index information asynchronously (don't block UI)
      if (data.documents.length > 0) {
        // Create new AbortController for this index check
        const abortController = new AbortController();
        set({ isLoadingIndexes: true, _indexCheckAbortController: abortController });

        // Get all document paths
        const documentPaths = data.documents.map((doc) => doc.file_path);
        console.log(`[Document Store] Starting index check for ${documentPaths.length} documents`);

        // Check indexes in background
        try {
          const indexData = await documentsApi.checkIndexes(documentPaths, abortController.signal);

          // Check if request was aborted
          if (abortController.signal.aborted) {
            console.log('[Document Store] Index check was cancelled');
            return;
          }

          console.log('[Document Store] Index check completed successfully');

          // Update documents with index information
          set((state) => ({
            documents: state.documents.map((doc) => ({
              ...doc,
              indexed_in: indexData.document_indexes[doc.file_path] || [],
            })),
            isLoadingIndexes: false,
            _indexCheckAbortController: null,
          }));
        } catch (indexError: any) {
          // Check if error is due to abort
          if (indexError.name === 'AbortError' || indexError.name === 'CanceledError') {
            console.log('[Document Store] Index check was aborted');
            set({ isLoadingIndexes: false, _indexCheckAbortController: null });
            return;
          }

          console.error('[Document Store] Error fetching index information:', indexError);
          // Don't show error toast - this is a non-critical background operation
          set({ isLoadingIndexes: false, _indexCheckAbortController: null });
        }
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  cancelIndexCheck: () => {
    const state = get();
    if (state._indexCheckAbortController) {
      console.log('[Document Store] Cancelling index check');
      state._indexCheckAbortController.abort();
      set({ isLoadingIndexes: false, _indexCheckAbortController: null });
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
