"use client";

import { useState, useEffect } from "react";
import {
  listUsers,
  getUserChats,
  type User,
  type ChatSession,
  type UserChatsResponse,
} from "@/lib/services/user";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PanelResizeHandle,
  Panel,
  PanelGroup,
} from "react-resizable-panels";

const PAGE_SIZE = 50;

interface PanelSizes {
  left: number;
  middle: number;
  right: number;
}

export default function AdminChatPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>("");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [currentChatPage, setCurrentChatPage] = useState(1);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatDetailsLoading, setIsChatDetailsLoading] = useState(false);

  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState<string | null>(null);

  // Panel sizes state
  const [panelSizes, setPanelSizes] = useState<PanelSizes>({
    left: 25,
    middle: 35,
    right: 40,
  });
  const [panelSizesLoading, setPanelSizesLoading] = useState(true);

  // Load panel sizes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminChatPanelSizes");
      if (saved) {
        const sizes = JSON.parse(saved) as PanelSizes;
        if (
          typeof sizes.left === "number" &&
          typeof sizes.middle === "number" &&
          typeof sizes.right === "number"
        ) {
          setPanelSizes(sizes);
        }
      }
    } catch (error) {
      console.error("Error loading panel sizes:", error);
    } finally {
      setPanelSizesLoading(false);
    }
  }, []);

  // Save panel sizes to localStorage
  const savePanelSizes = (newSizes: PanelSizes) => {
    setPanelSizes(newSizes);
    localStorage.setItem("adminChatPanelSizes", JSON.stringify(newSizes));
  };

  // Load users
  const loadUsers = async (page: number = 1, search?: string) => {
    setIsUsersLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await listUsers(skip, PAGE_SIZE, search);
      setUsers(response.users);
      setTotalUsers(response.total);
      setCurrentUserPage(page);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Load user's chats
  const loadUserChats = async (userId: string, page: number = 1) => {
    setIsChatsLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await getUserChats(userId, skip, PAGE_SIZE);
      setChats(response.sessions);
      setTotalChats(response.total);
      setSelectedUserName(response.user_name);
      setSelectedUserEmail(response.user_email);
      setCurrentChatPage(page);
    } catch (error) {
      console.error("Error loading user chats:", error);
      alert("Failed to load user chats");
    } finally {
      setIsChatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers(1);
  }, []);

  // Load chat details including messages
  const loadChatDetails = async (chatId: string) => {
    setIsChatDetailsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(`${API_BASE_URL}/chat/sessions/${chatId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load chat details");
      }

      const data = await response.json();
      console.log("[AdminChat] Loaded chat details:", data);
      setSelectedChat(data);
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading chat details:", error);
      alert("Failed to load chat details");
    } finally {
      setIsChatDetailsLoading(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedChatId(null);
    setSelectedChat(null);
    loadUserChats(userId, 1);
  };

  // Handle chat selection
  const handleSelectChat = (chat: ChatSession) => {
    setSelectedChatId(chat.id);
    loadChatDetails(chat.id);
  };

  // Handle user search
  const handleUserSearch = (value: string) => {
    setUserSearchTerm(value);
    loadUsers(1, value);
  };

  // Handle user page change
  const handleUserPageChange = (page: number) => {
    loadUsers(page, userSearchTerm);
  };

  // Handle chat page change
  const handleChatPageChange = (page: number) => {
    if (selectedUserId) {
      loadUserChats(selectedUserId, page);
    }
  };

  // Handle end session
  const handleEndSession = async () => {
    if (!selectedChatId) return;

    setIsEndingSession(selectedChatId);
    setShowEndDialog(false);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const analysisResponse = await fetch(
        `${API_BASE_URL}/chat/sessions/${selectedChatId}/analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!analysisResponse.ok) {
        throw new Error("Failed to end session");
      }

      const analysisData = await analysisResponse.json();
      console.log("[AdminChat] Session analysis completed:", analysisData);

      setSelectedChatId(null);
      setSelectedChat(null);
      setChatMessages([]);
    } catch (error) {
      console.error("[AdminChat] Error ending session:", error);
      alert("Failed to end session. Please try again.");
      setIsEndingSession(null);
    }
  };

  const totalUserPages = Math.ceil(totalUsers / PAGE_SIZE);
  const totalChatPages = Math.ceil(totalChats / PAGE_SIZE);

  if (panelSizesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Page Header */}
      <div className="shrink-0 border-b px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">User Chats</h1>
            <p className="mt-2 text-base text-muted-foreground">
              View and manage user conversations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Three Panel Resizable Layout */}
      <PanelGroup
        direction="horizontal"
        onLayout={(newSizes) => {
          savePanelSizes({
            left: newSizes[0],
            middle: newSizes[1],
            right: newSizes[2],
          });
        }}
        className="flex-1 overflow-hidden"
      >
        {/* Left Panel - User List */}
        <Panel defaultSize={panelSizes.left} minSize={15} maxSize={40}>
          <div className="flex h-full flex-col border-r">
            {/* User Search */}
            <div className="shrink-0 border-b p-4">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {isUsersLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                        selectedUserId === user.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="font-medium text-sm">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {user.chat_count} chat(s)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Pagination */}
            {totalUserPages > 1 && (
              <div className="shrink-0 border-t p-4 flex gap-2 justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUserPageChange(currentUserPage - 1)}
                  disabled={currentUserPage === 1}
                >
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentUserPage} / {totalUserPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUserPageChange(currentUserPage + 1)}
                  disabled={currentUserPage === totalUserPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Panel>

        {/* Resize Handle between left and middle */}
        <PanelResizeHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />

        {/* Middle Panel - Chat List */}
        <Panel defaultSize={panelSizes.middle} minSize={20} maxSize={50}>
          <div className="flex h-full flex-col border-r">
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="shrink-0 border-b p-4">
                  <h2 className="text-lg font-semibold">{selectedUserName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedUserEmail}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total chats: {totalChats}
                  </p>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {isChatsLoading ? (
                    <div className="space-y-4 p-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      No chats found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleSelectChat(chat)}
                          className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-l-4 ${
                            selectedChatId === chat.id
                              ? "bg-muted border-primary"
                              : "border-transparent"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {chat.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {chat.total_messages} message(s)
                            </p>
                            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="capitalize">{chat.status}</span>
                              <span>•</span>
                              <span>
                                {new Date(chat.started_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Pagination */}
                {totalChatPages > 1 && (
                  <div className="shrink-0 border-t p-4 flex gap-2 justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatPageChange(currentChatPage - 1)}
                      disabled={currentChatPage === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentChatPage} / {totalChatPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChatPageChange(currentChatPage + 1)}
                      disabled={currentChatPage === totalChatPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Select a user to view their chats</p>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Resize Handle between middle and right */}
        <PanelResizeHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />

        {/* Right Panel - Chat Details */}
        <Panel defaultSize={panelSizes.right} minSize={20} maxSize={60}>
          <div
            className={`flex h-full flex-col bg-muted/30 transition-opacity duration-300 ${
              isEndingSession === selectedChatId
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="shrink-0 border-b p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold truncate">
                        {selectedChat.title}
                      </h2>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="capitalize bg-muted px-2 py-1 rounded">
                          {selectedChat.status}
                        </span>
                        {selectedChat.analyzed_at && (
                          <span className="bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                            ✓ Analyzed
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedChat.status === "active" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowEndDialog(true)}
                        disabled={isEndingSession === selectedChatId}
                        className="whitespace-nowrap shrink-0"
                      >
                        {isEndingSession === selectedChatId
                          ? "Ending..."
                          : "End Chat"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chat Details Content */}
                <div className="flex-1 overflow-y-auto">
                  {isChatDetailsLoading ? (
                    <div className="space-y-4 p-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 space-y-6">
                      {/* Analysis Summary Section */}
                      {selectedChat.summary && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">
                            Analysis Summary
                          </h3>
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedChat.summary}
                          </p>
                        </div>
                      )}

                      {/* Comprehension Level */}
                      {selectedChat.comprehension_level && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">
                            Comprehension Level
                          </h3>
                          <div
                            className={`text-sm font-medium px-3 py-2 rounded text-center ${
                              selectedChat.comprehension_level === "HIGH"
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : selectedChat.comprehension_level === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                : "bg-red-500/20 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {selectedChat.comprehension_level}
                          </div>
                        </div>
                      )}

                      {/* Chat Info */}
                      <div className="space-y-2 text-xs pt-4 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium">
                            {selectedChat.model_name || selectedChat.model_id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Messages:
                          </span>
                          <span className="font-medium">
                            {selectedChat.total_messages}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Started:
                          </span>
                          <span className="font-medium">
                            {new Date(
                              selectedChat.started_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedChat.ended_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Ended:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                selectedChat.ended_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {selectedChat.analyzed_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Analyzed:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                selectedChat.analyzed_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Messages - Full Height */}
                      {chatMessages.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <h3 className="font-semibold text-sm sticky top-0 bg-muted/30 py-2">
                            Messages ({chatMessages.length})
                          </h3>
                          <div className="space-y-2">
                            {chatMessages.map((msg, idx) => (
                              <div
                                key={idx}
                                className="text-xs p-3 rounded bg-background border"
                              >
                                <div className="font-medium capitalize text-muted-foreground mb-1">
                                  {msg.role}
                                </div>
                                <div className="text-foreground break-words">
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Select a chat to view details</p>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* End Chat Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Chat?</DialogTitle>
            <DialogDescription>
              Once you end this chat, it cannot be resumed. The session will be
              analyzed and closed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isEndingSession !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEndingSession !== null}
            >
              {isEndingSession !== null ? "Ending..." : "End Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
