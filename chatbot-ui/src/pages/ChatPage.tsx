import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Bot, Trash2, Menu, X, Sparkles } from 'lucide-react';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Detect manual scrolling
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find((a) => a.agent_id === agentId);
    if (agent) {
      setAgent(agent);
      setSidebarOpen(false); // Close sidebar on mobile after selecting
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

  const hasContext = lastAIMessage?.contextDocuments && lastAIMessage.contextDocuments.length > 0;

  // Determine if last message is streaming
  const lastMessage = messages[messages.length - 1];
  const isLastMessageStreaming = isExecuting && lastMessage?.role === 'assistant';

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md hidden sm:block">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Chat Interface</h1>
              {currentAgent && (
                <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-1 truncate">
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{currentAgent.name}</span>
                  {currentAgent.index_name && (
                    <span title="RAG Enabled">
                      <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop: Agent selector and clear button */}
            <div className="hidden md:flex items-center space-x-3">
              <Select
                options={agentOptions}
                value={currentAgent?.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-48 lg:w-64"
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

            {/* Mobile: Menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile: Agent selector (expanded) */}
        {sidebarOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200 space-y-2 animate-fadeIn">
            <Select
              options={agentOptions}
              value={currentAgent?.agent_id || ''}
              onChange={(e) => handleAgentChange(e.target.value)}
              className="w-full"
            />
            {messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearChat}
                icon={<Trash2 className="w-4 h-4" />}
                className="w-full"
              >
                Clear Chat History
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {/* No Agent Selected */}
            {!currentAgent && (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
                  Select an agent to start chatting
                </h3>
                <p className="text-sm sm:text-base text-gray-500 text-center max-w-md">
                  Choose an agent from the {window.innerWidth < 768 ? 'menu' : 'dropdown'} above to begin your conversation
                </p>
              </div>
            )}

            {/* Empty Chat */}
            {currentAgent && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-4 shadow-lg">
                  <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
                  Start a conversation
                </h3>
                <p className="text-sm sm:text-base text-gray-500 text-center max-w-md mb-4">
                  {currentAgent.index_name
                    ? `This agent has access to documents in the "${currentAgent.index_name}" index.`
                    : 'This agent will respond based on its training and system instructions.'}
                </p>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200 rounded-xl p-4 max-w-md w-full shadow-sm">
                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    Agent Configuration
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Temperature: {currentAgent.temperature}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Max Tokens: {currentAgent.max_tokens || 'Default'}
                    </li>
                    {currentAgent.index_name && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        RAG Enabled with {currentAgent.index_name}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="py-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    isLastMessageStreaming && index === messages.length - 1
                  }
                />
              ))}
            </div>

            {/* Loading indicator */}
            {isExecuting && !isLastMessageStreaming && (
              <div className="flex justify-start mb-6 px-4 sm:px-6 animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-2.5 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span className="text-gray-600 text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {!autoScroll && messages.length > 0 && (
            <button
              onClick={() => {
                setAutoScroll(true);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="absolute bottom-24 right-8 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-110 z-10"
              title="Scroll to bottom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}

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
        {hasContext && (
          <div className="hidden lg:block lg:w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <ContextDisplay contextDocuments={lastAIMessage.contextDocuments!} />
          </div>
        )}

        {/* Mobile Context (Bottom Sheet) */}
        {hasContext && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-64 overflow-y-auto">
            <ContextDisplay contextDocuments={lastAIMessage.contextDocuments!} compact />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
