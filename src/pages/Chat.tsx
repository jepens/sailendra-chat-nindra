
import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchChatSessions, fetchChatMessages, sendMessage } from "@/services/chatService";
import { ChatMessage, ChatSession } from "@/types/chat";
import SessionList from "@/components/chat/SessionList";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInput from "@/components/chat/ChatInput";
import { useAuth } from "@/contexts/AuthContext";

const Chat = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
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
  const loadMessages = useCallback(async () => {
    if (!selectedSessionId) return;
    
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await fetchChatMessages(selectedSessionId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedSessionId, toast]);
  
  // Initial data load
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);
  
  // Load messages when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadMessages();
    }
  }, [selectedSessionId, loadMessages]);
  
  // Set up polling for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadSessions();
        if (selectedSessionId) {
          loadMessages();
        }
      }
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [user, selectedSessionId, loadSessions, loadMessages]);
  
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
  
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sessions List */}
        <SessionList 
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
          isLoading={isLoadingSessions}
        />
        
        {/* Chat Area */}
        <div className="hidden md:flex flex-col flex-1 h-full">
          {selectedSessionId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className="font-medium dark:text-white">
                    {sessions.find(s => s.session_id === selectedSessionId)?.sender_name || selectedSessionId}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedSessionId}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <ChatMessageList 
                messages={messages}
                isLoading={isLoadingMessages}
              />
              
              {/* Message Input */}
              <ChatInput 
                onSendMessage={handleSendMessage}
                isDisabled={!selectedSessionId}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
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
