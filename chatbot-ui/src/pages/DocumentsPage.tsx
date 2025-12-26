import React, { useEffect, useState, useRef } from 'react';
import { FileText, FolderUp } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentList from '../components/documents/DocumentList';
import UpdateDirectoryModal from '../components/documents/UpdateDirectoryModal';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const DocumentsPage: React.FC = () => {
  const {
    documents,
    isLoading,
    isLoadingIndexes,
    fetchDocuments,
    deleteDocument,
    cancelIndexCheck,
  } = useDocumentStore();
  const [isUpdateDirectoryModalOpen, setIsUpdateDirectoryModalOpen] = useState(false);

  // Use ref to prevent duplicate calls in React StrictMode (development)
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    // Fetch documents on mount
    console.log('[DocumentsPage] Fetching documents on mount');
    fetchDocuments();

    // Cleanup: Cancel any ongoing index check when component unmounts
    return () => {
      console.log('[DocumentsPage] Component unmounting, cancelling index check');
      cancelIndexCheck();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleDelete = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      await deleteDocument(filename);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-primary-600" />
              Document Management
            </h1>
            <p className="text-gray-600 mt-2">
              Upload and manage PDF documents for your knowledge base
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<FolderUp className="w-5 h-5" />}
            onClick={() => setIsUpdateDirectoryModalOpen(true)}
            disabled={documents.length === 0}
          >
            Update from Directory
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>
          <DocumentUpload />
        </div>
      </div>

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Documents ({documents.length})
          </h2>
          <div className="flex items-center space-x-4">
            {isLoading && documents.length === 0 && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Spinner size="sm" />
                <span className="text-sm">Loading documents...</span>
              </div>
            )}
            {!isLoading && isLoadingIndexes && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Spinner size="sm" />
                <span className="text-sm">Checking indexes...</span>
              </div>
            )}
          </div>
        </div>

        <DocumentList
          documents={documents}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>

      {/* Update Directory Modal */}
      <UpdateDirectoryModal
        isOpen={isUpdateDirectoryModalOpen}
        onClose={() => setIsUpdateDirectoryModalOpen(false)}
        documentCount={documents.length}
      />
    </div>
  );
};

export default DocumentsPage;
