import React from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Database, Box, Ruler, BarChart } from 'lucide-react';
import type { Index } from '../../types/index.types';

interface IndexDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: Index | null;
}

const IndexDetailsModal: React.FC<IndexDetailsModalProps> = ({ isOpen, onClose, index }) => {
  if (!index) return null;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'success';
      case 'initializing':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Index Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Database className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{index.name}</h3>
              <Badge variant={getStatusVariant(index.status)} className="mt-1">
                {index.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimension */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Ruler className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Dimension</p>
                <p className="text-lg font-semibold text-gray-900">{index.dimension}</p>
              </div>
            </div>
          </div>

          {/* Metric */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <BarChart className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Distance Metric</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{index.metric}</p>
              </div>
            </div>
          </div>

          {/* Vector Count */}
          <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <Box className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Total Vectors</p>
                <p className="text-lg font-semibold text-gray-900">
                  {index.total_vector_count.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">About this Index</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• This index uses the <strong>{index.metric}</strong> distance metric for similarity search</li>
            <li>• Vector dimension is set to <strong>{index.dimension}</strong></li>
            <li>• Currently storing <strong>{index.total_vector_count.toLocaleString()}</strong> vectors</li>
            <li>• Status: <strong>{index.status}</strong></li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default IndexDetailsModal;
