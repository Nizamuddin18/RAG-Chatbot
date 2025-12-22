import React, { useState, memo } from 'react';
import { Bot, User, Copy, Check, Clock } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types/chat.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-3xl`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 ${
            isUser
              ? 'bg-blue-100 ml-3'
              : 'bg-purple-100'
          } rounded-full p-2`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-blue-600" />
          ) : (
            <Bot className="w-5 h-5 text-purple-600" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'mr-3' : ''}`}>
          <div
            className={`rounded-lg p-4 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>

            {/* Execution Metrics for AI responses */}
            {!isUser && message.executionTimeMs && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Response time: {message.executionTimeMs}ms</span>
              </div>
            )}
          </div>

          {/* Copy Button for AI responses */}
          {!isUser && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
