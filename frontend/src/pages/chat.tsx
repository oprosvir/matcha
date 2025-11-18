import { AppLayout } from "@/components/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, MoreVertical, Ban, Flag } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import type { Conversation } from "@/types/chat";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { getInitials } from "@/lib/utils";
import { getPhotoUrl } from "@/utils/photoUtils";
import { useNavigate, useSearchParams } from "react-router";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserActions } from "@/hooks/useUserActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { ReportUserDialog } from "@/components/ReportUserDialog";

function ConversationCardContent({
  conversation,
}: {
  conversation: Conversation;
}) {
  const { data: messages, isLoading: messagesLoading } = useMessages(
    conversation.chatId
  );
  const [messageContent, setMessageContent] = useState("");
  const { sendMessage, isWebSocketConnected, readMessages } = useChat();
  const { user, isUserLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observedMessageIdsRef = useRef<Set<string>>(new Set());
  const messageElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages, conversation.chatId]);

  useEffect(() => {
    if (!messages || !user?.id) return;

    // Observing which messages are visible to the user
    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: string[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLDivElement) {
            const id = entry.target.dataset.messageId;
            const read = entry.target.dataset.read === "true";
            if (id && !observedMessageIdsRef.current.has(id) && !read) {
              observedMessageIdsRef.current.add(id);
              newlyVisible.push(id);
            }
          }
        }
        if (newlyVisible.length > 0) {
          readMessages(newlyVisible); // Websocket event to mark messages as read on the server
          // Decrement unread badge on the client
          queryClient.setQueryData(
            ["unreadMessagesCount"],
            (oldData: number | undefined) => {
              const current = oldData ?? 0;
              const next = current - newlyVisible.length;
              return next > 0 ? next : 0;
            }
          );
          // Mark messages as read on the client
          queryClient.setQueryData(
            ["messages", conversation.chatId],
            (oldData: any) => {
              if (!Array.isArray(oldData)) return oldData;
              const idSet = new Set(newlyVisible);
              return oldData.map((m: any) =>
                idSet.has(m.id) ? { ...m, read: true } : m
              );
            }
          );
        }
      },
      { threshold: 0.6 }
    );

    for (const msg of messages) {
      if (msg.senderId !== user.id) {
        const el = messageElementsRef.current.get(msg.id);
        if (el) observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [messages, user?.id, readMessages]);

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

  return messagesLoading || isUserLoading ? (
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
          <>
            {messages?.map((msg) => (
              <div
                key={msg.id}
                data-message-id={msg.id}
                data-read={Boolean((msg as any).read)}
                ref={(el) => {
                  if (el) {
                    messageElementsRef.current.set(msg.id, el);
                  } else {
                    messageElementsRef.current.delete(msg.id);
                  }
                }}
                className={`flex ${
                  msg.senderId === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words ${
                    msg.senderId === user?.id
                      ? "bg-blue-500 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.senderId === user?.id
                        ? "text-blue-100"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
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
      </div>
    </CardContent>
  );
}

export function Chat() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const { data: conversations, isLoading: conversationsLoading } =
    useConversations();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("fake_account");

  // Fetch public profile for connection status
  const { profile } = usePublicProfile(selectedConversation?.profilePreview.username || null);
  const connectionStatus = profile?.connectionStatus;
  const userId = profile?.user.id;

  // Use shared user actions hook
  const { blockMutation, unblockMutation, reportMutation } = useUserActions({
    username: selectedConversation?.profilePreview.username,
    onBlockSuccess: () => {
      setBlockDialogOpen(false);
      navigate('/chat');
      setSelectedConversation(null);
    },
    onReportSuccess: () => {
      setReportDialogOpen(false);
      setSelectedReportReason("fake_account");
    },
  });

  // Sync selected conversation with URL parameter
  useEffect(() => {
    const targetUsername = searchParams.get('with');

    if (!targetUsername) {
      // No 'with' parameter - clear selection
      setSelectedConversation(null);
      return;
    }

    if (!conversations) {
      return;
    }

    // Find conversation matching the URL parameter
    const conversation = conversations.find(
      c => c.profilePreview.username === targetUsername
    );

    // Update selection if different from current
    if (conversation && selectedConversation?.chatId !== conversation.chatId) {
      setSelectedConversation(conversation);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    queryClient.setQueryData(
      ["activeChatId"],
      selectedConversation?.chatId ?? null
    );
    return () => {
      queryClient.setQueryData(["activeChatId"], null);
    };
  }, [selectedConversation, queryClient]);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Matches Sidebar */}
        <Card
          className={`flex flex-col w-full md:w-1/4 h-full ${
            selectedConversation ? "hidden md:flex" : "flex"
          }`}
        >
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
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0 ${
                      selectedConversation?.chatId === conversation.chatId
                        ? "bg-accent border-l-4 border-l-primary"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      navigate(`/chat?with=${conversation.profilePreview.username}`);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getPhotoUrl(
                              conversation.profilePreview.profilePicture
                            )}
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
                          <p className="text-sm font-medium text-foreground truncate">
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
              <div className="p-4 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                <p className="text-sm">No matches yet</p>
                <p className="text-xs mt-1">
                  Start swiping to find your perfect match!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card
          className={`w-full md:w-3/4 flex flex-col p-0 h-full ${
            selectedConversation ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b flex items-center pt-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden mr-1"
                      onClick={() => navigate('/chat')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        navigate(`/profile/${selectedConversation.profilePreview.username}`)
                      }
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getPhotoUrl(
                            selectedConversation.profilePreview.profilePicture
                          )}
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
                        <h3 className="font-semibold text-foreground">
                          {selectedConversation.profilePreview.firstName}{" "}
                          {selectedConversation.profilePreview.lastName}
                        </h3>
                      </div>
                    </div>
                  </div>
                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {connectionStatus?.youBlockedThem ? (
                        <DropdownMenuItem
                          onClick={() => userId && unblockMutation.mutate(userId)}
                          disabled={unblockMutation.isPending}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {unblockMutation.isPending ? "Unblocking..." : "Unblock User"}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setBlockDialogOpen(true)}>
                          <Ban className="mr-2 h-4 w-4" />
                          Block User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                        <Flag className="mr-2 h-4 w-4" />
                        Report User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Block User Dialog */}
      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onConfirm={() => userId && blockMutation.mutate(userId)}
        isPending={blockMutation.isPending}
        userName={selectedConversation?.profilePreview.firstName}
      />

      {/* Report User Dialog */}
      <ReportUserDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onConfirm={(reason) => userId && reportMutation.mutate({ userId, reason })}
        isPending={reportMutation.isPending}
        userName={selectedConversation?.profilePreview.firstName}
        selectedReason={selectedReportReason}
        onReasonChange={setSelectedReportReason}
      />
    </AppLayout>
  );
}
