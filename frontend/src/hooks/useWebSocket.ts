import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, userId: string) => void;
}

export function useWebSocket(enabled: boolean = true): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socketInstance = io(API_URL, {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [enabled]);

  const joinChat = useCallback((chatId: string) => {
    if (socket?.connected) {
      socket.emit('joinChat', { chatId });
    }
  }, [socket]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket?.connected) {
      socket.emit('leaveChat', { chatId });
    }
  }, [socket]);

  const sendMessage = useCallback((chatId: string, content: string, userId: string) => {
    if (socket?.connected) {
      socket.emit('sendMessage', { chatId, content, userId });
    }
  }, [socket]);

  return { socket, isConnected, joinChat, leaveChat, sendMessage };
}
