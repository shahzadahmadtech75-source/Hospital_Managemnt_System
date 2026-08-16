import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';

// Components
import ConversationList from '../../components/messages/ConversationList';
import ConversationHeader from '../../components/messages/ConversationHeader';
import MessageList from '../../components/messages/MessageList';
import MessageInput from '../../components/messages/MessageInput';
import EmptyState from '../../components/messages/EmptyState';
import LoadingState from '../../components/messages/LoadingState';
import TypingIndicator from '../../components/messages/TypingIndicator';
import NewConversationDropdown from '../../components/messages/NewConversationDropdown';  // ✅ ADD THIS

// Icons
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const MessagesPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // State
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Check mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // New message
    socket.on('newMessage', handleNewMessage);

    // Typing
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    // Read receipt
    socket.on('messageRead', handleMessageRead);

    // Online status
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('messageRead');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark active conversation as read
  useEffect(() => {
    if (activeConversation) {
      markConversationAsRead(activeConversation._id);
    }
  }, [activeConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/messages/conversations');
      if (response.data.success) {
        setConversations(response.data.data || []);
        // Calculate total unread
        const unread = response.data.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setTotalUnread(unread);
      }
    } catch (err) {
      setError('Failed to load conversations');
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId, reset = true) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const response = await axiosInstance.get(
        `/messages/conversations/${conversationId}/messages?page=1&limit=50`
      );
      if (response.data.success) {
        if (reset) {
          setMessages(response.data.data || []);
        } else {
          setMessages(prev => [...response.data.data, ...prev]);
        }
        setHasMore(response.data.pagination?.hasNext || false);
        setPage(1);
      }
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (!activeConversation || !hasMore) return;
    const nextPage = page + 1;
    try {
      const response = await axiosInstance.get(
        `/messages/conversations/${activeConversation._id}/messages?page=${nextPage}&limit=50`
      );
      if (response.data.success) {
        setMessages(prev => [...response.data.data, ...prev]);
        setPage(nextPage);
        setHasMore(response.data.pagination?.hasNext || false);
      }
    } catch (err) {
      toast.error('Failed to load more messages');
    }
  };

  // Send message
  const sendMessage = async (content) => {
    if (!activeConversation || !content.trim() || !socket) return;
    setSending(true);
    try {
      socket.emit('sendMessage', {
        conversationId: activeConversation._id,
        content: content.trim(),
      });
      // Optimistically add message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        conversation: activeConversation._id,
        sender: { _id: user.id, username: user.username, profileImage: user.profileImage },
        content: content.trim(),
        type: 'text',
        readBy: [user.id],
        createdAt: new Date().toISOString(),
        __isTemp: true,
      };
      setMessages(prev => [...prev, tempMessage]);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Mark conversation as read
  const markConversationAsRead = async (conversationId) => {
    try {
      await axiosInstance.patch(`/messages/conversations/${conversationId}/read`);
      // Update unread count in conversation list
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
      setTotalUnread(prev => Math.max(0, prev - (activeConversation?.unreadCount || 0)));
    } catch (err) {
      // Silent fail
    }
  };

  // Handle new message from socket
  const handleNewMessage = useCallback((data) => {
    // Update messages
    setMessages(prev => [...prev, data]);

    // Update conversation list
    setConversations(prev =>
      prev.map(c => {
        if (c._id === data.conversation) {
          const isRead = data.sender?._id === user.id;
          return {
            ...c,
            lastMessage: {
              content: data.content,
              sender: data.sender?._id,
              timestamp: data.createdAt,
            },
            lastMessageTimestamp: data.createdAt,
            unreadCount: isRead ? c.unreadCount || 0 : (c.unreadCount || 0) + 1,
          };
        }
        return c;
      })
    );

    // Update total unread
    if (data.sender?._id !== user.id) {
      setTotalUnread(prev => prev + 1);
    }

    // Update active conversation last message
    if (activeConversation?._id === data.conversation) {
      setActiveConversation(prev => ({
        ...prev,
        lastMessage: {
          content: data.content,
          sender: data.sender?._id,
          timestamp: data.createdAt,
        },
        lastMessageTimestamp: data.createdAt,
        unreadCount: 0,
      }));
    }
  }, [user, activeConversation]);

  // Handle typing
  const handleUserTyping = useCallback((data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.conversationId]: {
        userId: data.userId,
        timestamp: Date.now(),
      },
    }));
    // Clear typing after 3 seconds if no stop event
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        if (newState[data.conversationId]?.userId === data.userId) {
          delete newState[data.conversationId];
        }
        return newState;
      });
    }, 3000);
  }, []);

  const handleUserStoppedTyping = useCallback((data) => {
    setTypingUsers(prev => {
      const newState = { ...prev };
      if (newState[data.conversationId]?.userId === data.userId) {
        delete newState[data.conversationId];
      }
      return newState;
    });
  }, []);

  // Handle read receipt
  const handleMessageRead = useCallback((data) => {
    setMessages(prev =>
      prev.map(m =>
        m._id === data.messageId
          ? { ...m, readBy: [...m.readBy, data.readBy], readAt: data.readAt }
          : m
      )
    );
  }, []);

  // Handle online/offline
  const handleUserOnline = useCallback((data) => {
    setOnlineUsers(prev => ({ ...prev, [data.userId]: true }));
  }, []);

  const handleUserOffline = useCallback((data) => {
    setOnlineUsers(prev => ({ ...prev, [data.userId]: false }));
  }, []);

  // Select conversation
  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  // Handle new conversation created
  const handleConversationCreated = (conversation) => {
    fetchConversations();
    if (conversation) {
      selectConversation(conversation);
    }
  };

  // Go back to conversation list on mobile
  const goBackToList = () => {
    setShowConversationList(true);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Get other participant
  const getOtherParticipant = (conversation) => {
    if (!conversation) return null;
    return conversation.otherParticipant || null;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant(activeConversation);
  const isTyping = activeConversation && typingUsers[activeConversation._id];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* ✅ ADD HEADER WITH NEW CONVERSATION BUTTON */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 rounded-t-lg flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
        <NewConversationDropdown onConversationCreated={handleConversationCreated} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 bg-white rounded-b-lg border border-gray-200 border-t-0 overflow-hidden">
        {/* Conversation List */}
        {(!isMobileView || showConversationList) && (
          <div className={`${isMobileView ? 'w-full' : 'w-80 border-r border-gray-200'} flex-shrink-0`}>
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?._id}
              onSelect={selectConversation}
              onlineUsers={onlineUsers}
            />
          </div>
        )}

        {/* Chat Area */}
        {(!isMobileView || !showConversationList) && (
          <div className="flex-1 flex flex-col min-w-0">
            {activeConversation ? (
              <>
                <ConversationHeader
                  conversation={activeConversation}
                  otherParticipant={otherParticipant}
                  isOnline={otherParticipant ? onlineUsers[otherParticipant._id] : false}
                  onBack={isMobileView ? goBackToList : null}
                />
                
                <MessageList
                  messages={messages}
                  loading={loadingMessages}
                  currentUserId={user?.id}
                  onLoadMore={loadMoreMessages}
                  hasMore={hasMore}
                  messagesEndRef={messagesEndRef}
                />
                {isTyping && (
                  <TypingIndicator
                    name={otherParticipant?.username || 'User'}
                  />
                )}
                <MessageInput
                  onSend={sendMessage}
                  onTyping={() => {
                    if (socket && activeConversation) {
                      socket.emit('typing', { conversationId: activeConversation._id });
                    }
                  }}
                  onStopTyping={() => {
                    if (socket && activeConversation) {
                      socket.emit('stopTyping', { conversationId: activeConversation._id });
                    }
                  }}
                  disabled={!isConnected || sending}
                  sending={sending}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;