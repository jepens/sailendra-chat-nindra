import { useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { DateSeparator } from './DateSeparator';
import { Loader2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  loading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ChatMessageList({ 
  messages, 
  loading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll to bottom on first load or when new messages are added
    if (isFirstLoad.current && messages.length > 0) {
      scrollToBottom();
      isFirstLoad.current = false;
    }
  }, [messages]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore?.();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Helper function to extract phone number from message content
  const extractPhoneNumber = (content: string): string => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    const lines = content.split('\n');
    if (lines.length >= 2 && lines[0].toLowerCase() === 'whatsapp') {
      const phoneNumber = lines[1];
      return phoneNumber && typeof phoneNumber === 'string' ? phoneNumber : '';
    }
    return content || '';
  };

  // Helper function to extract actual message content
  const extractMessageContent = (content: string): string => {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    const lines = content.split('\n');
    if (lines.length >= 3 && lines[0].toLowerCase() === 'whatsapp') {
      return lines.slice(2).join('\n') || '';
    }
    return content || '';
  };

  // Helper function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  // Helper function to group messages by date
  const groupMessagesByDate = (messages: ChatMessageType[]) => {
    const grouped: Array<{ date: Date; messages: ChatMessageType[] }> = [];
    
    messages.forEach((msg) => {
      const messageDate = new Date(msg.message.timestamp || msg.created_at || new Date());
      const lastGroup = grouped[grouped.length - 1];
      
      if (!lastGroup || !isSameDay(lastGroup.date, messageDate)) {
        grouped.push({
          date: messageDate,
          messages: [msg]
        });
      } else {
        lastGroup.messages.push(msg);
      }
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-full">
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      {/* Intersection observer target for infinite scroll */}
      <div ref={observerRef} className="h-4" />

      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          {/* Date separator */}
          <DateSeparator date={group.date} />
          
          {/* Messages for this date */}
          {group.messages.map((msg, index) => {
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
                key={msg.id || `${groupIndex}-${index}`}
                senderId={senderId}
                message={messageContent}
                timestamp={msg.message.timestamp || msg.created_at || new Date().toISOString()}
                isOutgoing={isOutgoing}
                trigger={msg.message.trigger}
              />
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
