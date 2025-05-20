
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isOutgoing = message.message.type === 'human';
  
  // Process the message content to remove the first two lines if needed
  const processContent = (content: string) => {
    const lines = content.split('\n');
    if (lines.length > 2) {
      return lines.slice(2).join('\n');
    }
    return content;
  };
  
  const content = processContent(message.message.content || '');
  const timestamp = message.message.timestamp || message.created_at || new Date().toISOString();
  
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`rounded-lg p-3 max-w-[80%] break-words ${
          isOutgoing 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        <div className="text-xs mt-1 flex justify-end opacity-70">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
