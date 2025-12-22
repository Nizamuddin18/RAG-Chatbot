import React, { useEffect, useState } from 'react';
import { Database, Plus } from 'lucide-react';
import { useIndexStore } from '../store/indexStore';
import IndexCard from '../components/indexes/IndexCard';
import IndexCreateModal from '../components/indexes/IndexCreateModal';
import IndexDetailsModal from '../components/indexes/IndexDetailsModal';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { Index } from '../types/index.types';

const IndexesPage: React.FC = () => {
  const { indexes, isLoading, fetchIndexes, deleteIndex } = useIndexStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<Index | null>(null);

  useEffect(() => {
    fetchIndexes();
  }, [fetchIndexes]);

  const handleDelete = async (indexName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the index "${indexName}"? This action cannot be undone.`
      )
    ) {
      await deleteIndex(indexName);
    }
  };

  const handleViewDetails = (index: Index) => {
    setSelectedIndex(index);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedIndex(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Database className="w-8 h-8 mr-3 text-primary-600" />
              Index Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage Pinecone vector indexes for your documents
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Index
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && indexes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4">Loading indexes...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && indexes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No indexes yet</h3>
          <p className="text-gray-500 mb-6">Create your first vector index to get started</p>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Index
          </Button>
        </div>
      )}

      {/* Indexes Grid */}
      {indexes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Indexes ({indexes.length})
            </h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Spinner size="sm" />
                <span className="text-sm">Refreshing...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexes.map((index) => (
              <IndexCard
                key={index.name}
                index={index}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <IndexCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <IndexDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        index={selectedIndex}
      />
    </div>
  );
};

export default IndexesPage;
