import React, { useState } from 'react';
import ConversationItem from './ConversationItem';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ConversationList = ({ conversations, activeId, onSelect, onlineUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true;
    const name = conv.otherParticipant?.username || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              isActive={activeId === conversation._id}
              onSelect={() => onSelect(conversation)}
              isOnline={conversation.otherParticipant ? onlineUsers[conversation.otherParticipant._id] : false}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;