import React, { useState } from 'react';
import { Trash2, Database, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { formatFileSize, formatDate } from '../../utils/errorHandler';
import type { Document } from '../../types/document.types';
import AddToIndexModal from './AddToIndexModal';

interface DocumentListProps {
  documents: Document[];
  onDelete: (filename: string) => void;
  isLoading: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, isLoading }) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAddToIndexModalOpen, setIsAddToIndexModalOpen] = useState(false);

  const handleAddToIndex = (document: Document) => {
    setSelectedDocument(document);
    setIsAddToIndexModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddToIndexModalOpen(false);
    setSelectedDocument(null);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-500">Upload your first PDF document to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document.filename} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {document.filename}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatFileSize(document.size_bytes)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(document.uploaded_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Database className="w-4 h-4" />}
                        onClick={() => handleAddToIndex(document)}
                        disabled={isLoading}
                      >
                        Add to Index
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => onDelete(document.filename)}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddToIndexModal
        isOpen={isAddToIndexModalOpen}
        onClose={handleCloseModal}
        document={selectedDocument}
      />
    </>
  );
};

export default DocumentList;
