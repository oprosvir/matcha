import { createContext, useContext, useCallback } from "react";
import type { ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "./AuthContext";
import type { Socket } from "socket.io-client";

interface ChatContextType {
  socket: Socket | null;
  isWebSocketConnected: boolean;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const {
    socket,
    isConnected: isWebSocketConnected,
    joinChat,
    leaveChat,
    sendMessage: sendMessageWS,
  } = useWebSocket(isAuthenticated);

  const sendMessage = useCallback(
    (chatId: string, content: string) => {
      if (user?.id) sendMessageWS(chatId, content, user.id);
    },
    [user?.id, sendMessageWS]
  );

  return (
    <ChatContext.Provider
      value={{
        socket,
        isWebSocketConnected,
        joinChat,
        leaveChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
