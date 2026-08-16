import React from 'react';

const TypingIndicator = ({ name }) => {
  return (
    <div className="px-4 py-1.5 border-t border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-gray-500">
          {name} is typing...
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;