import React, { useEffect, useRef } from 'react';
import { MessageSquare, Bot, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAgentStore } from '../store/agentStore';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ContextDisplay from '../components/chat/ContextDisplay';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';

const ChatPage: React.FC = () => {
  const { messages, currentAgent, isExecuting, sendMessage, setAgent, clearMessages } =
    useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find((a) => a.agent_id === agentId);
    if (agent) {
      setAgent(agent);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearMessages();
    }
  };

  const agentOptions = [
    { value: '', label: 'Select an agent' },
    ...agents.map((agent) => ({
      value: agent.agent_id,
      label: agent.name,
    })),
  ];

  // Get the last AI message with context
  const lastAIMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === 'assistant');

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chat Interface</h1>
              {currentAgent && (
                <p className="text-sm text-gray-600">
                  Chatting with <strong>{currentAgent.name}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Select
              options={agentOptions}
              value={currentAgent?.agent_id || ''}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="w-64"
            />
            {messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearChat}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* No Agent Selected */}
            {!currentAgent && (
              <div className="flex flex-col items-center justify-center h-full">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an agent to start chatting
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Choose an agent from the dropdown above to begin your conversation
                </p>
              </div>
            )}

            {/* Empty Chat */}
            {currentAgent && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="p-4 bg-purple-100 rounded-full mb-4">
                  <Bot className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 text-center max-w-md mb-4">
                  {currentAgent.index_name
                    ? `This agent has access to documents in the "${currentAgent.index_name}" index.`
                    : 'This agent will respond based on its training and system instructions.'}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                  <p className="text-sm text-blue-900 font-medium mb-1">Agent Configuration</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Temperature: {currentAgent.temperature}</li>
                    <li>• Max Tokens: {currentAgent.max_tokens || 'Default'}</li>
                    {currentAgent.index_name && <li>• RAG Enabled</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isExecuting && (
              <div className="flex justify-start mb-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <ChatInput
            onSend={sendMessage}
            disabled={!currentAgent || isExecuting}
            placeholder={
              currentAgent
                ? 'Type your message...'
                : 'Select an agent to start chatting'
            }
          />
        </div>

        {/* Context Sidebar */}
        {lastAIMessage?.contextDocuments && lastAIMessage.contextDocuments.length > 0 && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto p-4">
            <ContextDisplay contextDocuments={lastAIMessage.contextDocuments} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
