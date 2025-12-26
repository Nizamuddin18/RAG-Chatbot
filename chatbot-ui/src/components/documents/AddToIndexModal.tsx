import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { useIndexStore } from '../../store/indexStore';
import { startJobPolling } from '../../utils/jobPolling';
import type { Document } from '../../types/document.types';
import type { Index } from '../../types/index.types';

interface AddToIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const AddToIndexModal: React.FC<AddToIndexModalProps> = ({ isOpen, onClose, document }) => {
  const navigate = useNavigate();
  const { indexes, fetchIndexes, updateIndexWithDocuments, isLoading } = useIndexStore();
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [updatedIndex, setUpdatedIndex] = useState<Index | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      setIsProcessing(false);
      setProgress(0);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedIndex || !document) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Start the job
      const jobResponse = await updateIndexWithDocuments(selectedIndex, [document.file_path]);

      if (jobResponse) {
        // Start polling for job status
        startJobPolling(jobResponse.job_id, {
          onProgress: (newProgress) => {
            setProgress(newProgress);
            setError(null); // Clear any previous errors on progress
          },
          onComplete: (result) => {
            setUpdatedIndex(result);
            setShowSuccess(true);
            setIsProcessing(false);
            setError(null);
            // Refresh indexes to get latest data
            fetchIndexes();
          },
          onError: (errorMsg) => {
            const errorMessage = errorMsg || 'An unknown error occurred while updating the index';
            console.error('Job failed:', errorMessage);
            setError(errorMessage);
            setIsProcessing(false);
          },
        });
      } else {
        setError('Failed to start index update job');
        setIsProcessing(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start index update';
      console.error('Error starting job:', errorMessage);
      setError(errorMessage);
      setIsProcessing(false);
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
      title={showSuccess ? "Document Added Successfully" : "Add Document to Index"}
    >
      {!showSuccess ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Document:</p>
            <p className="font-medium text-gray-900">{document?.filename}</p>
          </div>

          <Select
            label="Select Index"
            options={indexOptions}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
            required
            disabled={isProcessing}
          />

          {indexes.length === 0 && !isLoading && (
            <p className="text-sm text-amber-600">
              No indexes available. Please create an index first.
            </p>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-4">
              <ProgressBar
                progress={progress}
                label="Updating index with document..."
                showPercentage={true}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Update Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading || isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!selectedIndex || isLoading || isProcessing}
              loading={isLoading && !isProcessing}
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
              Document <strong>{document?.filename}</strong> has been successfully added to index
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

export default AddToIndexModal;
