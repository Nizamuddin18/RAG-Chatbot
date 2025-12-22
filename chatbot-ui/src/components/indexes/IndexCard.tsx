import React from 'react';
import { Database, Trash2, Info } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { Index } from '../../types/index.types';

interface IndexCardProps {
  index: Index;
  onDelete: (indexName: string) => void;
  onViewDetails: (index: Index) => void;
}

const IndexCard: React.FC<IndexCardProps> = ({ index, onDelete, onViewDetails }) => {
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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Database className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{index.name}</h3>
            <Badge variant={getStatusVariant(index.status)} className="mt-1">
              {index.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Dimension</span>
          <span className="text-sm font-medium text-gray-900">{index.dimension}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Metric</span>
          <span className="text-sm font-medium text-gray-900 capitalize">{index.metric}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Vectors</span>
          <span className="text-sm font-medium text-gray-900">
            {index.total_vector_count.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          icon={<Info className="w-4 h-4" />}
          onClick={() => onViewDetails(index)}
          className="flex-1"
        >
          Details
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => onDelete(index.name)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default IndexCard;
