import type { Messages, Message } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const API_URL = import.meta.env.VITE_API_URL;
    const socketInstance = io(API_URL, {
      transports: ['websocket'],
    });

    setSocket(socketInstance);

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

    socketInstance.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      handleNewMessage(message);
    });

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

  const handleNewMessage = useCallback((message: Message) => {
    queryClient.setQueryData(['messages', message.chatId], (oldData: Messages | undefined) => {
      if (!oldData) return [message];
      return [...oldData, message];
    });
  }, [queryClient]);

  const sendMessage = useCallback((chatId: string, content: string, userId: string) => {
    if (socket?.connected) {
      socket.emit('sendMessage', { chatId, content, userId });
      const tempMessage: Message = {
        id: `temp-${uuidv4()}`, // Will be replaced by server response when we get it
        chatId: chatId,
        senderId: userId,
        content: content,
        isRead: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData(['messages', chatId], (oldData: Messages | undefined) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      });
    }
  }, [socket, queryClient]);

  return { socket, isConnected, joinChat, leaveChat, sendMessage };
}
