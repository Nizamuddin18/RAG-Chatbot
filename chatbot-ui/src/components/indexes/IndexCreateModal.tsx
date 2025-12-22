import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useIndexStore } from '../../store/indexStore';

interface IndexCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IndexCreateModal: React.FC<IndexCreateModalProps> = ({ isOpen, onClose }) => {
  const { createIndex, isLoading } = useIndexStore();
  const [formData, setFormData] = useState({
    index_name: '',
    dimension: '384',
    metric: 'cosine',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const metricOptions = [
    { value: 'cosine', label: 'Cosine' },
    { value: 'euclidean', label: 'Euclidean' },
    { value: 'dotproduct', label: 'Dot Product' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.index_name.trim()) {
      newErrors.index_name = 'Index name is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.index_name)) {
      newErrors.index_name = 'Index name must be lowercase alphanumeric with hyphens only';
    }

    const dimension = parseInt(formData.dimension);
    if (!dimension || dimension <= 0) {
      newErrors.dimension = 'Dimension must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await createIndex({
      index_name: formData.index_name,
      dimension: parseInt(formData.dimension),
      metric: formData.metric,
    });

    if (success) {
      setFormData({ index_name: '', dimension: '384', metric: 'cosine' });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ index_name: '', dimension: '384', metric: 'cosine' });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Index">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Index Name"
          placeholder="my-vector-index"
          value={formData.index_name}
          onChange={(e) => setFormData({ ...formData, index_name: e.target.value })}
          error={errors.index_name}
          helperText="Use lowercase letters, numbers, and hyphens only"
          required
        />

        <Input
          label="Dimension"
          type="number"
          placeholder="384"
          value={formData.dimension}
          onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
          error={errors.dimension}
          helperText="Must match your embedding model's dimension (default: 384)"
          required
        />

        <Select
          label="Distance Metric"
          options={metricOptions}
          value={formData.metric}
          onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
          required
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The dimension should match your embedding model. The default
            model (sentence-transformers/all-MiniLM-L6-v2) uses 384 dimensions.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isLoading} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            Create Index
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IndexCreateModal;
