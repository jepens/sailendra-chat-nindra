import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { Loader2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  loading?: boolean;
}

export function ChatMessageList({ messages, loading = false }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to extract phone number from message content
  const extractPhoneNumber = (content: string): string => {
    const lines = content.split('\n');
    if (lines.length >= 2 && lines[0].toLowerCase() === 'whatsapp') {
      return lines[1];
    }
    return content;
  };

  // Helper function to extract actual message content
  const extractMessageContent = (content: string): string => {
    const lines = content.split('\n');
    if (lines.length >= 3 && lines[0].toLowerCase() === 'whatsapp') {
      return lines.slice(2).join('\n');
    }
    return content;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.map((msg, index) => {
        let senderId: string;
        let messageContent: string;
        let isOutgoing: boolean;
        
        switch (msg.message.type) {
          case 'human':
            senderId = extractPhoneNumber(msg.message.content);
            messageContent = extractMessageContent(msg.message.content);
            isOutgoing = true;
            break;
          default: // 'ai' case
            senderId = 'AI';
            messageContent = msg.message.content;
            isOutgoing = false;
        }
        
        return (
          <ChatMessage
            key={index}
            senderId={senderId}
            message={messageContent}
            timestamp={msg.message.timestamp || msg.created_at || new Date().toISOString()}
            isOutgoing={isOutgoing}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
