
import { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';
import { Loader2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

const ChatMessageList = ({ messages, isLoading }: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-sailendra-500" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
        No messages yet
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
