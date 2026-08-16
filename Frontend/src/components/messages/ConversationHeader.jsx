import React from 'react';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const ConversationHeader = ({ conversation, otherParticipant, isOnline, onBack }) => {
  if (!otherParticipant) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3 p-3 border-b border-gray-200 bg-white flex-shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          {otherParticipant.profileImage ? (
            <img
              src={otherParticipant.profileImage}
              alt={otherParticipant.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-blue-600">
              {getInitials(otherParticipant.username)}
            </span>
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {otherParticipant.username || 'Unknown User'}
        </p>
        <p className="text-xs text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};

export default ConversationHeader;