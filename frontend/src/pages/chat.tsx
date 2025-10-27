import { AppLayout } from "@/components/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import type { Conversation } from "@/types/chat";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";

function ConversationCardContent({
  conversation,
}: {
  conversation: Conversation;
}) {
  const { data: messages, isLoading: messagesLoading } = useMessages(
    conversation.chatId
  );
  const [messageContent, setMessageContent] = useState("");
  const { sendMessage, isWebSocketConnected, joinChat, leaveChat } = useAuth();

  // Join chat room when component mounts
  useEffect(() => {
    if (isWebSocketConnected) {
      joinChat(conversation.chatId);
    }

    return () => {
      if (isWebSocketConnected) {
        leaveChat(conversation.chatId);
      }
    };
  }, [conversation.chatId, isWebSocketConnected, joinChat, leaveChat]);

  const handleSendMessage = () => {
    if (messageContent.trim() && isWebSocketConnected) {
      sendMessage(conversation.chatId, messageContent.trim());
      setMessageContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return messagesLoading ? (
    <div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  ) : (
    <CardContent className="flex-1 flex flex-col p-0 min-h-0 max-h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-full">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">
                Start a conversation with{" "}
                {conversation.profilePreview.firstName}
              </p>
              <p className="text-xs mt-1">Send your first message below</p>
            </div>
          </div>
        ) : (
          messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === "current-user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === "current-user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === "current-user"
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Message ${conversation.profilePreview.firstName}...`}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={!isWebSocketConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || !isWebSocketConnected}
            size="sm"
            className="my-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!isWebSocketConnected && (
          <p className="text-xs text-red-500 mt-1">
            WebSocket disconnected. Messages may not be sent.
          </p>
        )}
      </div>
    </CardContent>
  );
}

export function Chat() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const { data: conversations, isLoading: conversationsLoading } =
    useConversations();
  const { isWebSocketConnected } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AppLayout>
      <div className="flex flex-row gap-6 h-full">
        {/* Matches Sidebar */}
        <Card className="flex flex-col w-1/4 h-full">
          <CardContent className="overflow-y-auto p-0 h-full">
            {conversationsLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(20)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    {i < 19 && <Separator />}
                  </div>
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.chatId}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                      selectedConversation?.chatId === conversation.chatId
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={conversation.profilePreview.profilePicture}
                            alt={`${conversation.profilePreview.firstName} ${conversation.profilePreview.lastName}`}
                          />
                          <AvatarFallback>
                            {getInitials(
                              conversation.profilePreview.firstName,
                              conversation.profilePreview.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.profilePreview.firstName}{" "}
                            {conversation.profilePreview.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No matches yet</p>
                <p className="text-xs mt-1">
                  Start swiping to find your perfect match!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="w-3/4 flex flex-col p-0 h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b flex items-center pt-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedConversation.profilePreview.profilePicture}
                        alt={`${selectedConversation.profilePreview.firstName} ${selectedConversation.profilePreview.lastName}`}
                      />
                      <AvatarFallback>
                        {getInitials(
                          selectedConversation.profilePreview.firstName,
                          selectedConversation.profilePreview.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.profilePreview.firstName}{" "}
                        {selectedConversation.profilePreview.lastName}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isWebSocketConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {isWebSocketConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <ConversationCardContent conversation={selectedConversation} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
              <div className="text-center">
                <p className="text-lg font-medium">
                  Select a match to start chatting
                </p>
                <p className="text-sm mt-1">
                  Choose someone from your matches to begin a conversation
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
