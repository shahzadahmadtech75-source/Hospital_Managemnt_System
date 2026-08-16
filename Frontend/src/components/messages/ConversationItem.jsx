import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ConversationItem = ({ conversation, isActive, onSelect, isOnline }) => {
  const { otherParticipant, lastMessage, lastMessageTimestamp, unreadCount } = conversation;

  if (!otherParticipant) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
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
        {/* Online dot */}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800 truncate">
            {otherParticipant.username || 'Unknown User'}
          </p>
          {lastMessageTimestamp && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatTime(lastMessageTimestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate">
            {lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;