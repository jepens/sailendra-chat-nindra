import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Loader2, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchChatSessions, fetchChatMessages, sendMessage } from "@/services/chatService";
import { ChatMessage, ChatSession } from "@/types/chat";
import SessionList from "@/components/chat/SessionList";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { ContactName } from "@/components/chat/ContactName";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const Chat = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showChat, setShowChat] = useState(!isMobile);
  
  // Reset showChat when screen size changes
  useEffect(() => {
    setShowChat(!isMobile);
  }, [isMobile]);

  // Handle session selection
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (isMobile) {
      setShowChat(true);
    }
  };
  
  // Handle back to sessions list on mobile
  const handleBackToSessions = () => {
    setShowChat(false);
  };
  
  // Fetch sessions data
  const loadSessions = useCallback(async () => {
    try {
      const fetchedSessions = await fetchChatSessions();
      setSessions(fetchedSessions);
      
      // Select the most recent session if none is selected
      if (fetchedSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(fetchedSessions[0].session_id);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [selectedSessionId, toast]);
  
  // Fetch messages for selected session
  const loadMessages = useCallback(async (page: number = 1) => {
    if (!selectedSessionId) return;
    
    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setIsLoadingMessages(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { messages: fetchedMessages, hasMore } = await fetchChatMessages(selectedSessionId, page);
      
      setMessages(prev => 
        page === 1 ? fetchedMessages : [...prev, ...fetchedMessages]
      );
      setHasMoreMessages(hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      if (isInitialLoad) {
        setIsLoadingMessages(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [selectedSessionId, toast]);
  
  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreMessages) {
      loadMessages(currentPage + 1);
    }
  }, [currentPage, hasMoreMessages, isLoadingMore, loadMessages]);
  
  // Initial data load
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);
  
  // Load messages when session changes
  useEffect(() => {
    if (selectedSessionId) {
      setCurrentPage(1);
      setHasMoreMessages(true);
      loadMessages(1);
    }
  }, [selectedSessionId, loadMessages]);
  
  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!selectedSessionId) return;
    
    try {
      const newMessage = await sendMessage(selectedSessionId, message);
      
      // Update the UI optimistically
      setMessages(prev => [...prev, newMessage]);
      
      // Update the session list with the new message
      setSessions(prev => 
        prev.map(session => 
          session.session_id === selectedSessionId 
            ? {
                ...session,
                last_message: message,
                last_timestamp: new Date().toISOString()
              }
            : session
        )
      );
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const selectedSession = sessions.find(s => s.session_id === selectedSessionId);
  const chatTitle = selectedSession?.sender_name || 'Chat';
  
  return (
    <DashboardLayout 
      showBackButton={isMobile && showChat}
      title={isMobile && showChat ? chatTitle : undefined}
    >
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sessions List */}
        <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800`}>
        <SessionList 
          sessions={sessions}
          selectedSessionId={selectedSessionId}
            onSelectSession={handleSessionSelect}
          isLoading={isLoadingSessions}
        />
        </div>
        
        {/* Chat Area */}
        <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-col flex-1 h-full`}>
          {selectedSessionId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 flex items-center">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToSessions}
                    className="mr-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <ContactName 
                    phoneNumber={selectedSession?.sender_name || selectedSessionId || 'Unknown'}
                    className="font-medium dark:text-white"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Online
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                <ChatMessageList 
                  messages={messages}
                  loading={isLoadingMessages}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMoreMessages}
                  onLoadMore={handleLoadMore}
                />
              </div>
              
              {/* Message Input */}
              <ChatInput 
                onSendMessage={handleSendMessage}
                isDisabled={!selectedSessionId}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center px-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8 text-gray-500 dark:text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium dark:text-white">Select a conversation</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Choose a conversation from the sidebar to start chatting.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
