import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axiosInstance from '../api/axiosInstance';
import {toast} from '../components/common/Toaster'
import { eventBus } from '../utils/eventBus';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]); // ✅ NEW
  const [unreadCount, setUnreadCount] = useState(0); // ✅ NEW
  const socketRef = useRef(null);

  // Function to get valid token
  const getValidToken = async () => {
    let token = localStorage.getItem('hms_access_token');
    
    // Check if token is expired by decoding it
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        
        // If token expires in less than 30 seconds, refresh it
        if (exp - now < 30000) {
          console.log('🔄 Token expiring soon, refreshing...');
          try {
            const response = await axiosInstance.post('/auth/refresh', {}, { withCredentials: true });
            if (response.data.success) {
              const newToken = response.data.data.accessToken;
              localStorage.setItem('hms_access_token', newToken);
              token = newToken;
              console.log('✅ Token refreshed successfully');
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            logout();
            return null;
          }
        }
      } catch (e) {
        console.error('❌ Token decode error:', e);
        logout();
        return null;
      }
    }
    return token;
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }


    const connectSocket = async () => {
      const token = await getValidToken();
      if (!token) return;

      const serverUrl = import.meta.env.SOCKET_API_BASE_URL || 'http://localhost:5000';
      console.log('🔌 Connecting to Socket.IO server:', serverUrl);

      const socketInstance = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected! ID:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', async (error) => {
        console.error('❌ Socket connection error:', error.message);
        
        // If token expired, try to refresh and reconnect
        if (error.message === 'Token expired' || error.message === 'Authentication failed') {
          console.log('🔄 Token expired, attempting refresh...');
          try {
            const newToken = await getValidToken();
            if (newToken) {
              console.log('✅ Token refreshed, reconnecting...');
              socketInstance.auth = { token: newToken };
              socketInstance.connect();
            } else {
              logout();
            }
          } catch (refreshError) {
            console.error('❌ Refresh failed:', refreshError);
            logout();
          }
        }
        setIsConnected(false);
      });

      socketInstance.on('reconnect', () => {
        console.log('✅ Socket reconnected');
        setIsConnected(true);
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;
socket.on('newMessageNotification', (data) => {
  console.log('🔔 Notification received:', data);
  
  setNotifications(prev => [data, ...prev]);
  setUnreadCount(prev => prev + 1);

   eventBus.emit('newMessage', {
      message: data,
      senderName: data.sender?.name || 'Unknown',
      content: data.message?.content || '',
    });
  });    // ✅ Update unread count in navbar (if you have a badge)
      // This will be handled by the Messages tab
    

    return () => {
      socket.off('newMessageNotification');
    };
  }, [socket]);

  const value = {
    socket,
     isConnected,
      notifications,    // ✅ NEW
    unreadCount,      // ✅ NEW
    clearNotifications: () => {
      setNotifications([]);
      setUnreadCount(0);
    },
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;