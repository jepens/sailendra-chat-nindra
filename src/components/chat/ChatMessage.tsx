import { ContactName } from './ContactName';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ChatMessageProps {
  senderId: string;
  message: string;
  timestamp: string;
  isOutgoing?: boolean;
}

export function ChatMessage({ 
  senderId, 
  message, 
  timestamp, 
  isOutgoing = false 
}: ChatMessageProps) {
  // Only log in development and at debug level
  logger.debug('ChatMessage render:', { 
    senderId, 
    messageLength: message.length,
    isOutgoing 
  });

  return (
    <div className={cn(
      "flex gap-2 items-start px-2 md:px-4 py-2",
      isOutgoing ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {senderId === 'AI' ? (
            'AI'
          ) : (
            senderId.slice(0, 2).toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col max-w-[75%] md:max-w-[65%]",
        isOutgoing ? "items-end" : "items-start"
      )}>
        <span className="text-sm font-medium text-muted-foreground mb-1">
          {senderId === 'AI' ? (
            'AI'
          ) : (
            <ContactName 
              phoneNumber={senderId} 
              className="text-sm font-medium text-muted-foreground"
            />
          )}
        </span>
        <div className={cn(
          "rounded-lg px-3 py-2 break-words",
          isOutgoing 
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : senderId === 'AI'
              ? "bg-muted rounded-tl-none"
              : "bg-gray-100 dark:bg-gray-800 rounded-tl-none"
        )}>
          {message}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}
