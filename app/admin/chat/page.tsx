"use client";

import { useState, useEffect } from "react";
import {
  listUsers,
  getUserChats,
  type User,
  type ChatSession,
  type UserChatsResponse,
} from "@/lib/services/user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 50;

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

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    loadUserChats(userId, 1);
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

  const totalUserPages = Math.ceil(totalUsers / PAGE_SIZE);
  const totalChatPages = Math.ceil(totalChats / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8 px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">User Chats</h1>
            <p className="mt-2 text-base text-muted-foreground">
              View and manage user conversations
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Two Panel Layout */}
      <div className="grid grid-cols-3 gap-6 rounded-lg border bg-card overflow-hidden">
        {/* Left Panel - User List */}
        <div className="col-span-1 border-r flex flex-col">
          {/* User Search */}
          <div className="p-4 border-b">
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
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
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
                    <div className="text-xs text-muted-foreground">{user.email}</div>
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
            <div className="p-4 border-t flex gap-2 justify-between">
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

        {/* Right Panel - Chat List */}
        <div className="col-span-2 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{selectedUserName}</h2>
                <p className="text-sm text-muted-foreground">{selectedUserEmail}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total chats: {totalChats}
                </p>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {isChatsLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : chats.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No chats found
                  </div>
                ) : (
                  <div className="divide-y">
                    {chats.map((chat) => (
                      <div key={chat.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {chat.total_messages} message(s)
                            </p>
                            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="capitalize">{chat.status}</span>
                              <span>•</span>
                              <span>{new Date(chat.started_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                            {chat.model_id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Pagination */}
              {totalChatPages > 1 && (
                <div className="p-4 border-t flex gap-2 justify-between">
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
      </div>
    </div>
  );
}
