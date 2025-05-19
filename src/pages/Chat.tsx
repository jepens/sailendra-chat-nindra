
import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  waId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  messageType: string;
  direction: "incoming" | "outgoing";
  name?: string;
  timestamp: string;
  status: string;
}

interface Conversation {
  id: string;
  waId: string;
  phoneNumber: string;
  name?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

const Chat = () => {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      waId: "62812345678",
      phoneNumber: "+62 812-3456-78",
      name: "John Doe",
      lastMessage: "Hello, I have a question about your services",
      lastTimestamp: "2023-05-19T10:23:00Z",
      unreadCount: 2,
    },
    {
      id: "2",
      waId: "62898765432",
      phoneNumber: "+62 898-7654-32",
      name: "Jane Smith",
      lastMessage: "Thank you for your help",
      lastTimestamp: "2023-05-19T09:45:00Z",
      unreadCount: 0,
    },
    {
      id: "3",
      waId: "62856781234",
      phoneNumber: "+62 856-7812-34",
      lastMessage: "I'd like to schedule a meeting",
      lastTimestamp: "2023-05-18T16:30:00Z",
      unreadCount: 1,
    },
  ]);
  
  // Mock data for messages
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "m1",
        waId: "62812345678",
        fromNumber: "+62 812-3456-78",
        toNumber: "whatsapp",
        message: "Hello, I have a question about your services",
        messageType: "text",
        direction: "incoming",
        name: "John Doe",
        timestamp: "2023-05-19T10:23:00Z",
        status: "read"
      },
      {
        id: "m2",
        waId: "62812345678",
        fromNumber: "whatsapp",
        toNumber: "+62 812-3456-78",
        message: "Hi John, how can I help you today?",
        messageType: "text",
        direction: "outgoing",
        timestamp: "2023-05-19T10:25:00Z",
        status: "delivered"
      },
      {
        id: "m3",
        waId: "62812345678",
        fromNumber: "+62 812-3456-78",
        toNumber: "whatsapp",
        message: "I'd like to know more about your pricing plans",
        messageType: "text",
        direction: "incoming",
        name: "John Doe",
        timestamp: "2023-05-19T10:26:00Z",
        status: "read"
      },
      {
        id: "m4",
        waId: "62812345678",
        fromNumber: "+62 812-3456-78",
        toNumber: "whatsapp",
        message: "Do you have a monthly subscription option?",
        messageType: "text",
        direction: "incoming",
        name: "John Doe",
        timestamp: "2023-05-19T10:26:30Z",
        status: "read"
      }
    ],
    "2": [
      {
        id: "m5",
        waId: "62898765432",
        fromNumber: "+62 898-7654-32",
        toNumber: "whatsapp",
        message: "I've been trying to access my account",
        messageType: "text",
        direction: "incoming",
        name: "Jane Smith",
        timestamp: "2023-05-19T09:40:00Z",
        status: "read"
      },
      {
        id: "m6",
        waId: "62898765432",
        fromNumber: "whatsapp",
        toNumber: "+62 898-7654-32",
        message: "Could you please provide your account email so I can check?",
        messageType: "text",
        direction: "outgoing",
        timestamp: "2023-05-19T09:42:00Z",
        status: "delivered"
      },
      {
        id: "m7",
        waId: "62898765432",
        fromNumber: "+62 898-7654-32",
        toNumber: "whatsapp",
        message: "It's jane.smith@example.com",
        messageType: "text",
        direction: "incoming",
        name: "Jane Smith",
        timestamp: "2023-05-19T09:43:00Z",
        status: "read"
      },
      {
        id: "m8",
        waId: "62898765432",
        fromNumber: "whatsapp",
        toNumber: "+62 898-7654-32",
        message: "I've reset your password. You should receive an email shortly.",
        messageType: "text",
        direction: "outgoing",
        timestamp: "2023-05-19T09:44:00Z",
        status: "delivered"
      },
      {
        id: "m9",
        waId: "62898765432",
        fromNumber: "+62 898-7654-32",
        toNumber: "whatsapp",
        message: "Thank you for your help",
        messageType: "text",
        direction: "incoming",
        name: "Jane Smith",
        timestamp: "2023-05-19T09:45:00Z",
        status: "read"
      }
    ],
    "3": [
      {
        id: "m10",
        waId: "62856781234",
        fromNumber: "+62 856-7812-34",
        toNumber: "whatsapp",
        message: "I'd like to schedule a meeting",
        messageType: "text",
        direction: "incoming",
        timestamp: "2023-05-18T16:30:00Z",
        status: "read"
      }
    ]
  });

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // Example API call to send message through webhook
      // const response = await fetch('https://yourdomain.com/webhook/send-message', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: conversations.find(c => c.id === selectedConversation)?.phoneNumber,
      //     message: newMessage
      //   })
      // });
      
      // Mock API call success for demo
      setTimeout(() => {
        // Generate a new message
        const newMsg: Message = {
          id: `m${Date.now()}`,
          waId: conversations.find(c => c.id === selectedConversation)?.waId || "",
          fromNumber: "whatsapp",
          toNumber: conversations.find(c => c.id === selectedConversation)?.phoneNumber || "",
          message: newMessage,
          messageType: "text",
          direction: "outgoing",
          timestamp: new Date().toISOString(),
          status: "sent"
        };
        
        // Update messages
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: [...(prev[selectedConversation] || []), newMsg]
        }));
        
        // Update conversation last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? {
                  ...conv,
                  lastMessage: newMessage,
                  lastTimestamp: new Date().toISOString()
                }
              : conv
          )
        );
        
        // Show success toast
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully"
        });
        
        // Clear input
        setNewMessage("");
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversations List */}
        <div className="w-full md:w-80 lg:w-96 border-r bg-white flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`chat-list-item ${selectedConversation === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {conversation.name ? conversation.name.charAt(0) : '#'}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {conversation.name || conversation.phoneNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(conversation.lastTimestamp)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600 truncate max-w-[180px]">
                        {conversation.lastMessage}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-sailendra-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="hidden md:flex flex-col flex-1 h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                  {conversations.find(c => c.id === selectedConversation)?.name?.charAt(0) || '#'}
                </div>
                <div className="ml-3">
                  <div className="font-medium">
                    {conversations.find(c => c.id === selectedConversation)?.name || 
                      conversations.find(c => c.id === selectedConversation)?.phoneNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {conversations.find(c => c.id === selectedConversation)?.phoneNumber}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages[selectedConversation]?.map((message, index) => (
                  <div key={message.id} className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={message.direction === 'outgoing' ? 'message-bubble-outgoing' : 'message-bubble-incoming'}>
                      <div>{message.message}</div>
                      <div className="text-xs mt-1 flex justify-end">
                        {formatTimestamp(message.timestamp)}
                        {message.direction === 'outgoing' && (
                          <span className="ml-2">
                            {message.status === 'sent' && "✓"}
                            {message.status === 'delivered' && "✓✓"}
                            {message.status === 'read' && "✓✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-4 bg-white border-t">
                <form 
                  className="flex items-center space-x-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <Input
                    className="flex-1"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || isLoading}
                  >
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-8 w-8 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium">Select a conversation</h3>
                <p className="mt-2 text-sm text-gray-500">
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
