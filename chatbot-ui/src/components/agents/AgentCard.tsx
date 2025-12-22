import React, { memo } from 'react';
import { Bot, Calendar, Thermometer, FileText, Eye, Edit, Trash2, Play } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { Agent } from '../../types/agent.types';
import { formatDate } from '../../utils/errorHandler';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onViewDetails: (agent: Agent) => void;
  onExecute: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = memo(({
  agent,
  onEdit,
  onDelete,
  onViewDetails,
  onExecute,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            {agent.index_name && (
              <Badge variant="default" className="mt-1">
                {agent.index_name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* System Instruction Preview */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 line-clamp-3">
          {agent.system_instruction}
        </p>
      </div>

      {/* Agent Settings */}
      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Temperature</p>
            <p className="text-sm font-medium text-gray-900">{agent.temperature}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Max Tokens</p>
            <p className="text-sm font-medium text-gray-900">
              {agent.max_tokens || 'Default'}
            </p>
          </div>
        </div>
      </div>

      {/* Created Date */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
        <Calendar className="w-3 h-3" />
        <span>Created {formatDate(agent.created_at)}</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onExecute(agent)}
          icon={<Play className="w-4 h-4" />}
        >
          Execute
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetails(agent)}
          icon={<Eye className="w-4 h-4" />}
        >
          Details
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(agent)}
          icon={<Edit className="w-4 h-4" />}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(agent.agent_id)}
          icon={<Trash2 className="w-4 h-4" />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
});

AgentCard.displayName = 'AgentCard';

export default AgentCard;
