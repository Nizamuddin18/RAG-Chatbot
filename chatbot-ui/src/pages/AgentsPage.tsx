import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';
import { useAgentStore } from '../store/agentStore';
import { useChatStore } from '../store/chatStore';
import AgentCard from '../components/agents/AgentCard';
import AgentForm from '../components/agents/AgentForm';
import AgentDetailsModal from '../components/agents/AgentDetailsModal';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { Agent } from '../types/agent.types';

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { agents, isLoading, fetchAgents, deleteAgent } = useAgentStore();
  const { setAgent } = useChatStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (agentId: string) => {
    const agent = agents.find((a) => a.agent_id === agentId);
    if (
      agent &&
      window.confirm(
        `Are you sure you want to delete the agent "${agent.name}"? This action cannot be undone.`
      )
    ) {
      await deleteAgent(agentId);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailsModalOpen(true);
  };

  const handleExecute = (agent: Agent) => {
    setAgent(agent);
    navigate('/chat');
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedAgent(null);
  };

  const handleCreateNew = () => {
    setEditingAgent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bot className="w-8 h-8 mr-3 text-purple-600" />
              Agent Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage AI agents with custom instructions and RAG capabilities
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleCreateNew}
          >
            Create Agent
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-gray-600 mt-4">Loading agents...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && agents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
          <p className="text-gray-500 mb-6">Create your first AI agent to get started</p>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleCreateNew}
          >
            Create Agent
          </Button>
        </div>
      )}

      {/* Agents Grid */}
      {agents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Agents ({agents.length})</h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Spinner size="sm" />
                <span className="text-sm">Refreshing...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.agent_id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                onExecute={handleExecute}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AgentForm isOpen={isFormOpen} onClose={handleCloseForm} agent={editingAgent} />

      <AgentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        agent={selectedAgent}
      />
    </div>
  );
};

export default AgentsPage;
