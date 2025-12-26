import React, { useState, memo, useEffect } from 'react';
import { Bot, User, Copy, Check, Clock, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import type { ChatMessage as ChatMessageType } from '../../types/chat.types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({ message, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const [showCursor, setShowCursor] = useState(isStreaming);

  useEffect(() => {
    setShowCursor(isStreaming);
  }, [isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 max-w-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">System Message</span>
          </div>
          <p className="mt-1">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4 sm:px-6 animate-fadeIn`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-full sm:max-w-3xl lg:max-w-4xl`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 ${
            isUser ? 'ml-3 bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
          } rounded-full p-2.5 shadow-md ring-2 ring-white`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 min-w-0 ${isUser ? 'mr-3' : ''}`}>
          {/* Message Bubble */}
          <div
            className={`rounded-2xl shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto'
                : 'bg-white border border-gray-200'
            } transition-all duration-200 hover:shadow-md`}
          >
            <div className="px-4 py-3 sm:px-5 sm:py-4">
              {isUser ? (
                /* User message - plain text */
                <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                  {message.content}
                </div>
              ) : (
                /* AI message - with markdown and streaming effect */
                <div className="prose prose-sm sm:prose max-w-none prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
                  <ReactMarkdown
                    components={{
                      code(props) {
                        const { children, className, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;

                        return !isInline && match ? (
                          <div className="relative group/code">
                            <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                  toast.success('Code copied!');
                                }}
                                className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg text-sm"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...rest}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {/* Streaming cursor */}
                  {showCursor && (
                    <span className="inline-block w-0.5 h-5 bg-purple-600 ml-1 animate-pulse"></span>
                  )}
                </div>
              )}

              {/* Execution Metrics for AI responses */}
              {!isUser && message.executionTimeMs && (
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Generated in {(message.executionTimeMs / 1000).toFixed(2)}s</span>
                  {message.contextDocuments && message.contextDocuments.length > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-purple-600">
                        {message.contextDocuments.length} source{message.contextDocuments.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className={`flex items-center mt-2 space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Timestamp */}
            <div className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Copy Button for AI responses */}
            {!isUser && !showCursor && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
