import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { useIndexStore } from '../../store/indexStore';
import { FolderOpen, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Index } from '../../types/index.types';

interface UpdateDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCount: number;
}

const UpdateDirectoryModal: React.FC<UpdateDirectoryModalProps> = ({
  isOpen,
  onClose,
  documentCount,
}) => {
  const navigate = useNavigate();
  const { indexes, fetchIndexes, updateIndexFromDirectory, isLoading } = useIndexStore();
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [updatedIndex, setUpdatedIndex] = useState<Index | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && indexes.length === 0) {
      fetchIndexes();
    }
  }, [isOpen, indexes.length, fetchIndexes]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedIndex('');
      setUpdatedIndex(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedIndex) return;

    const result = await updateIndexFromDirectory(selectedIndex);
    if (result) {
      setUpdatedIndex(result);
      setShowSuccess(true);
    }
  };

  const handleViewIndexes = () => {
    onClose();
    navigate('/indexes');
  };

  const indexOptions = [
    { value: '', label: 'Select an index' },
    ...indexes.map((index) => ({
      value: index.name,
      label: `${index.name} (${index.total_vector_count} vectors)`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showSuccess ? "Directory Updated Successfully" : "Update Index from Directory"}
      size="md"
    >
      {!showSuccess ? (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Important</p>
              <p className="text-sm text-amber-700 mt-1">
                This will update the selected index with all {documentCount} documents from the data
                directory. This operation may take some time.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <FolderOpen className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Data Directory</p>
              <p className="text-xs text-gray-500 mt-1">{documentCount} documents available</p>
            </div>
          </div>

          <Select
            label="Select Index"
            options={indexOptions}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
            required
          />

          {indexes.length === 0 && !isLoading && (
            <p className="text-sm text-amber-600">
              No indexes available. Please create an index first.
            </p>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!selectedIndex || isLoading}
              loading={isLoading}
            >
              Update Index
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <p className="text-gray-700 mb-2">
              Successfully updated index with all documents from the directory
            </p>
            <p className="text-lg font-semibold text-gray-900">{updatedIndex?.name}</p>
          </div>

          {/* Updated Index Details */}
          {updatedIndex && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Updated Index Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700">Status</p>
                  <Badge variant="success" className="mt-1">
                    {updatedIndex.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Total Vectors</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {updatedIndex.total_vector_count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Dimension</p>
                  <p className="text-sm font-medium text-blue-900">{updatedIndex.dimension}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Metric</p>
                  <p className="text-sm font-medium text-blue-900 capitalize">{updatedIndex.metric}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleViewIndexes}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              View All Indexes
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UpdateDirectoryModal;
