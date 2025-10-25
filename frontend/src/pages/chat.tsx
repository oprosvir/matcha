import { AppLayout } from "@/components/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAllMatches } from "@/hooks/useAllMatches";
import type { Profile } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tokenManager } from "@/utils/tokenManager";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  receiverId: string;
  isRead: boolean;
}

export function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Profile | null>(null);
  const { data: matches, isLoading: matchesLoading } = useAllMatches();

  useEffect(() => {
    console.log(matches);
  }, [matches]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("receiveMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("connect");
      socket.off("receiveMessage");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && selectedMatch) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        timestamp: new Date(),
        senderId: "current-user", // This should come from auth context
        receiverId: selectedMatch.id,
        isRead: false,
      };

      socket.emit("sendMessage", newMessage);
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatLastActive = (lastActive: Date | null) => {
    if (!lastActive) return "Never";

    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Online";
    if (diffInMinutes < 60) return `Online ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440)
      return `Online ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Online ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const isOnline = (lastActive: Date | null) => {
    if (!lastActive) return false;
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60)
    );
    return diffInMinutes < 5; // Consider online if active within last 5 minutes
  };

  return (
    <AppLayout>
      <div className="flex flex-row gap-6 h-full">
        {/* Matches Sidebar */}
        <Card className="flex flex-col w-1/4 h-full">
          <CardContent className="overflow-y-auto p-0 h-full">
            {matchesLoading ? (
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
            ) : matches && matches.length > 0 ? (
              <div>
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                      selectedMatch?.id === match.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              match.photos.find((p) => p.is_profile_pic)?.url ||
                              match.photos[0]?.url
                            }
                            alt={`${match.firstName} ${match.lastName}`}
                          />
                          <AvatarFallback>
                            {getInitials(match.firstName, match.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(match.lastTimeActive) && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {match.firstName} {match.lastName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatLastActive(match.lastTimeActive)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {match.biography || "No bio available"}
                        </p>
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
          {selectedMatch ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b flex items-center pt-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          selectedMatch.photos.find((p) => p.is_profile_pic)
                            ?.url || selectedMatch.photos[0]?.url
                        }
                        alt={`${selectedMatch.firstName} ${selectedMatch.lastName}`}
                      />
                      <AvatarFallback>
                        {getInitials(
                          selectedMatch.firstName,
                          selectedMatch.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedMatch.firstName} {selectedMatch.lastName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {selectedMatch.fameRating > 0 && (
                          <Badge variant="outline" className="text-xs">
                            ⭐ {selectedMatch.fameRating}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            isOnline(selectedMatch.lastTimeActive)
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {isOnline(selectedMatch.lastTimeActive)
                            ? "Online"
                            : formatLastActive(selectedMatch.lastTimeActive)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 flex flex-col p-0 min-h-0 max-h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-full">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <p className="text-sm">
                          Start a conversation with {selectedMatch.firstName}
                        </p>
                        <p className="text-xs mt-1">
                          Send your first message below
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
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
                          <p className="text-sm">{msg.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === "current-user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
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
                      placeholder={`Message ${selectedMatch.firstName}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      size="sm"
                      className="my-auto"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
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
