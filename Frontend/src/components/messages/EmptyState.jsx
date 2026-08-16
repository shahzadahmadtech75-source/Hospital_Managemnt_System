import React from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const EmptyState = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-white rounded-lg border border-gray-200">
      <div className="text-center">
        <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Conversations Yet</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Start messaging with your healthcare provider or patients.
          Conversations will appear here once you start communicating.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;