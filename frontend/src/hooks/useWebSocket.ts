import type { Messages, Message } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { tokenManager } from '@/utils/tokenManager';
import type { NotificationMatch, NotificationUnlike, NotificationLike, NotificationView, Notification } from '@/types/notification';
import { NotificationType } from '@/types/notification';
import { getNotificationDetails } from '@/lib/getNotificationContent';
import { toast } from 'sonner';
import confetti from "canvas-confetti";

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (chatId: string, content: string, userId: string) => void;
  readMessages: (messageIds: string[]) => void;
}

export function useWebSocket(enabled: boolean = true): UseWebSocketReturn {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000;
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  function handleNewNotification(notification: Notification) {
    queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
      if (!oldData) return [notification];
      return [...oldData, notification];
    });

    switch (notification.type) {
      case NotificationType.LIKE:
        toast.info(getNotificationDetails(notification));
        break;
      case NotificationType.UNLIKE:
        toast.info(getNotificationDetails(notification));
        break;
      case NotificationType.MATCH:
        toast.info(getNotificationDetails(notification));
        triggerConfetti();
        break;
      case NotificationType.VIEW:
        toast.info(getNotificationDetails(notification));
        break;
    }
  }

  useEffect(() => {
    if (!enabled) return;

    const API_URL = import.meta.env.VITE_API_URL;
    const socketInstance = io(API_URL, {
      transports: ['websocket'],
      auth: {
        accessToken: tokenManager.getToken(),
      }
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('ping');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (_) => {
      setIsConnected(false);
    });

    socketInstance.on('newMessage', (message: Message) => {
      handleNewMessage(message);
    });

    socketInstance.on('like', (like: NotificationLike) => {
      handleNewNotification(like);
    });

    socketInstance.on('unlike', (unlike: NotificationUnlike) => {
      handleNewNotification(unlike);
    });

    socketInstance.on('match', (match: NotificationMatch) => {
      handleNewNotification(match);
    });

    socketInstance.on('view', (view: NotificationView) => {
      handleNewNotification(view);
    });

    // Set up ping interval to update last_time_active
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [enabled]);

  const handleNewMessage = useCallback((message: Message) => {
    queryClient.setQueryData(['messages', message.chatId], (oldData: Messages | undefined) => {
      if (!oldData) return [message];
      return [...oldData, message];
    });
    // Increment unread messages only if the message is not from the active chat
    const activeChatId = queryClient.getQueryData<string | null>(['activeChatId']);
    if (activeChatId !== message.chatId) {
      queryClient.setQueryData(['unreadMessagesCount'], (oldData: number | undefined) => {
        if (!oldData) return 1;
        return oldData + 1;
      });
    }
  }, [queryClient]);

  const sendMessage = useCallback((chatId: string, content: string, userId: string) => {
    if (socket?.connected) {
      socket.emit('sendMessage', { chatId, content, userId });
      const tempMessage: Message = {
        id: `temp-${uuidv4()}`, // Will be replaced by server response when we get it
        chatId: chatId,
        senderId: userId,
        content: content,
        read: false,
        createdAt: new Date(),
      };
      queryClient.setQueryData(['messages', chatId], (oldData: Messages | undefined) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      });
    }
  }, [socket, queryClient]);

  const readMessages = useCallback((messageIds: string[]) => {
    if (socket?.connected && messageIds.length > 0) {
      socket.emit('readMessages', { messageIds });
    }
  }, [socket]);

  return { socket, isConnected, sendMessage, readMessages };
}
