import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn, isTemp }) => {
  const { content, sender, createdAt, readBy } = message;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              {sender?.profileImage ? (
                <img
                  src={sender.profileImage}
                  alt={sender?.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-[8px] font-medium text-blue-600">
                  {getInitials(sender?.username)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div className={`relative`}>
          <div
            className={`px-3 py-2 rounded-lg ${
              isOwn
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            } ${isTemp ? 'opacity-70' : ''}`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          </div>
          {/* Time and read status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : ''}`}>
            <span className="text-[10px] text-gray-400">
              {formatTime(createdAt)}
            </span>
            {isOwn && !isTemp && (
              <span className="text-[10px] text-gray-400">
                {readBy && readBy.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
            {isTemp && (
              <span className="text-[10px] text-gray-400">Sending...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;