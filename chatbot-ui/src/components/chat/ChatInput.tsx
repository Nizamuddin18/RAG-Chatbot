import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isSending) {
      setIsSending(true);
      await onSend(message.trim());
      setMessage('');
      setIsSending(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Auto-focus on mount and when enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const isDisabled = disabled || isSending;

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 shadow-sm">
      <div className="flex items-end space-x-2 sm:space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className="w-full resize-none border-2 border-gray-300 rounded-xl px-4 py-3 text-sm sm:text-base
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500
                     placeholder-gray-400 transition-all duration-200 shadow-sm
                     hover:border-gray-400 focus:shadow-md"
            style={{ maxHeight: '200px', minHeight: '48px' }}
          />

          {/* Character counter (optional) */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
              {message.length}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!message.trim() || isDisabled}
          icon={
            isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )
          }
          className="flex-shrink-0 h-12 shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
          Enter
        </kbd>
        <span>to send,</span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
          Shift + Enter
        </kbd>
        <span>for new line</span>
      </p>
    </form>
  );
};

export default ChatInput;
