
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
  const timestamp = message.created_at || new Date().toISOString();
  
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={isOutgoing ? 'message-bubble-outgoing' : 'message-bubble-incoming'}>
        <div className="whitespace-pre-wrap">{content}</div>
        <div className="text-xs mt-1 flex justify-end opacity-70">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
