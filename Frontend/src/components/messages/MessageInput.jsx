import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const MessageInput = ({ onSend, onTyping, onStopTyping, disabled, sending }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (message.trim() && !disabled && !sending) {
      onSend(message);
      setMessage('');
      onStopTyping();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    onTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  return (
    <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connecting...' : 'Type a message...'}
          disabled={disabled || sending}
          rows="1"
          className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          style={{ maxHeight: '100px', minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled || sending}
          className={`p-2 rounded-lg transition-colors ${
            message.trim() && !disabled && !sending
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;