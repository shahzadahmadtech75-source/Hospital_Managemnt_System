import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({
  messages,
  loading,
  currentUserId,
  onLoadMore,
  hasMore,
  messagesEndRef,
}) => {
  const listRef = useRef(null);
  const prevScrollHeight = useRef(0);

  // Handle loading more messages when scrolling up
  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMore && !loading) {
      prevScrollHeight.current = e.target.scrollHeight;
      onLoadMore();
    }
  };

  // Preserve scroll position after loading more
  useEffect(() => {
    if (listRef.current && prevScrollHeight.current > 0) {
      const newScrollHeight = listRef.current.scrollHeight;
      listRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">No messages yet. Say hello! 👋</div>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {loading && (
        <div className="text-center text-xs text-gray-400 py-2">
          Loading more...
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble
          key={message._id}
          message={message}
          isOwn={message.sender?._id === currentUserId}
          isTemp={message.__isTemp}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;