import React from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Bot, Database, Thermometer, FileText, Calendar, Clock } from 'lucide-react';
import type { Agent } from '../../types/agent.types';
import { formatDate } from '../../utils/errorHandler';

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ isOpen, onClose, agent }) => {
  if (!agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
              <p className="text-sm text-gray-500">Agent ID: {agent.agent_id}</p>
            </div>
          </div>
        </div>

        {/* System Instruction */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">System Instruction</h4>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{agent.system_instruction}</p>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Index */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Vector Index</p>
                {agent.index_name ? (
                  <Badge variant="success" className="mt-1">
                    {agent.index_name}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No index (General AI)</p>
                )}
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Thermometer className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-lg font-semibold text-gray-900">{agent.temperature}</p>
              </div>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Max Tokens</p>
                <p className="text-lg font-semibold text-gray-900">
                  {agent.max_tokens || 'Default'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-700">Created</p>
              <p className="text-sm font-medium text-blue-900">{formatDate(agent.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-700">Last Updated</p>
              <p className="text-sm font-medium text-blue-900">{formatDate(agent.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-2">About this Agent</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>
              • This agent uses a temperature of <strong>{agent.temperature}</strong>{' '}
              {agent.temperature < 0.5
                ? '(focused responses)'
                : agent.temperature > 1.5
                ? '(creative responses)'
                : '(balanced responses)'}
            </li>
            {agent.index_name && (
              <li>
                • RAG is <strong>enabled</strong> with index <strong>{agent.index_name}</strong>
              </li>
            )}
            {!agent.index_name && <li>• RAG is <strong>disabled</strong> (general AI mode)</li>}
            <li>
              • Response length limited to{' '}
              <strong>{agent.max_tokens || 'default'} tokens</strong>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default AgentDetailsModal;
