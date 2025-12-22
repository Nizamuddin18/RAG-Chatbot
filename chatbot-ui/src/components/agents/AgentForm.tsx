import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import { useAgentStore } from '../../store/agentStore';
import { useIndexStore } from '../../store/indexStore';
import type { Agent, AgentCreate } from '../../types/agent.types';

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
}

const AgentForm: React.FC<AgentFormProps> = ({ isOpen, onClose, agent }) => {
  const { createAgent, updateAgent, isLoading } = useAgentStore();
  const { indexes, fetchIndexes } = useIndexStore();

  const [formData, setFormData] = useState<AgentCreate>({
    name: '',
    system_instruction: '',
    index_name: '',
    temperature: 0.7,
    max_tokens: 1000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchIndexes();
      if (agent) {
        setFormData({
          name: agent.name,
          system_instruction: agent.system_instruction,
          index_name: agent.index_name || '',
          temperature: agent.temperature,
          max_tokens: agent.max_tokens || 1000,
        });
      }
    }
  }, [isOpen, agent, fetchIndexes]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        system_instruction: '',
        index_name: '',
        temperature: 0.7,
        max_tokens: 1000,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    }

    if (!formData.system_instruction.trim()) {
      newErrors.system_instruction = 'System instruction is required';
    }

    if (formData.temperature !== undefined && (formData.temperature < 0 || formData.temperature > 2)) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    if (formData.max_tokens && (formData.max_tokens < 1 || formData.max_tokens > 8000)) {
      newErrors.max_tokens = 'Max tokens must be between 1 and 8000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: AgentCreate = {
      ...formData,
      index_name: formData.index_name || undefined,
    };

    let result;
    if (agent) {
      result = await updateAgent(agent.agent_id, data);
    } else {
      result = await createAgent(data);
    }

    if (result) {
      onClose();
    }
  };

  const indexOptions = [
    { value: '', label: 'No index (General AI)' },
    ...indexes.map((index) => ({
      value: index.name,
      label: `${index.name} (${index.total_vector_count} vectors)`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Agent' : 'Create New Agent'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Agent Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Document Assistant"
          error={errors.name}
          required
        />

        <TextArea
          label="System Instruction"
          value={formData.system_instruction}
          onChange={(e) => setFormData({ ...formData, system_instruction: e.target.value })}
          placeholder="e.g., You are a helpful assistant that answers questions based on provided documents..."
          rows={5}
          error={errors.system_instruction}
          required
        />

        <Select
          label="Select Index (Optional)"
          options={indexOptions}
          value={formData.index_name || ''}
          onChange={(e) => setFormData({ ...formData, index_name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) =>
                setFormData({ ...formData, temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused (0)</span>
              <span className="font-medium text-gray-900">{formData.temperature}</span>
              <span>Creative (2)</span>
            </div>
            {errors.temperature && (
              <p className="text-sm text-red-600 mt-1">{errors.temperature}</p>
            )}
          </div>

          <Input
            label="Max Tokens"
            type="number"
            value={formData.max_tokens?.toString() || ''}
            onChange={(e) =>
              setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 1000 })
            }
            placeholder="1000"
            error={errors.max_tokens}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Lower temperature (0-0.5) for focused, consistent responses</li>
            <li>• Higher temperature (1-2) for creative, varied responses</li>
            <li>• Select an index to enable RAG with your documents</li>
            <li>• Max tokens controls response length</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {agent ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AgentForm;
