import { ContactName } from './ContactName';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, MessageSquare } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { MessagePlatform, ChatMessage as ChatMessageType } from '@/types/chat';
import { SentimentBadge } from '@/components/sentiment/SentimentBadge';
import { useMessageSentiment } from '@/hooks/useSentiment';
import { useEffect } from 'react';

interface ChatMessageProps {
  senderId: string;
  message: string;
  timestamp: string;
  isOutgoing?: boolean;
  trigger?: MessagePlatform;
  messageId?: string;
  sessionId?: string;
  enableSentiment?: boolean;
  chatMessage?: ChatMessageType;
}

export function ChatMessage({ 
  senderId, 
  message, 
  timestamp, 
  isOutgoing = false,
  trigger,
  messageId,
  sessionId,
  enableSentiment = true,
  chatMessage
}: ChatMessageProps) {
  // Only log in development and at debug level
  logger.debug('ChatMessage render:', { 
    senderId, 
    messageLength: message.length,
    isOutgoing,
    trigger,
    enableSentiment
  });

  // Sentiment analysis hook
  const { 
    sentiment, 
    loading: sentimentLoading, 
    analyze: analyzeSentiment,
    hasSentiment
  } = useMessageSentiment(
    messageId || `${senderId}-${timestamp}`, 
    sessionId || 'default', 
    message
  );

  // Auto-analyze sentiment for non-AI messages
  useEffect(() => {
    if (enableSentiment && 
        senderId !== 'AI' && 
        !isOutgoing && 
        messageId && 
        sessionId && 
        !hasSentiment && 
        !sentimentLoading) {
      analyzeSentiment();
    }
  }, [enableSentiment, senderId, isOutgoing, messageId, sessionId, hasSentiment, sentimentLoading, analyzeSentiment]);

  const getPlatformColor = (platform?: MessagePlatform) => {
    switch (platform) {
      case 'whatsapp':
        return 'bg-green-500';
      case 'instagram':
        return 'bg-pink-500';
      case 'facebook':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const shouldShowSentiment = enableSentiment && 
    senderId !== 'AI' && 
    !isOutgoing && 
    (sentiment || sentimentLoading || chatMessage?.sentiment);

  // Use existing sentiment from chatMessage if available
  const displaySentiment = chatMessage?.sentiment || sentiment;

  return (
    <div className={cn(
      "flex gap-2 items-start px-2 md:px-4 py-2",
      isOutgoing ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className={cn(
          "text-primary-foreground",
          trigger ? getPlatformColor(trigger) : "bg-primary"
        )}>
          {senderId === 'AI' ? (
            'AI'
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col max-w-[75%] md:max-w-[65%]",
        isOutgoing ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-muted-foreground">
            {senderId === 'AI' ? (
              'AI'
            ) : (
              <ContactName 
                phoneNumber={senderId} 
                className="text-sm font-medium text-muted-foreground"
              />
            )}
          </span>
          {trigger && (
            <Badge variant="secondary" className="text-xs">
              {trigger}
            </Badge>
          )}
          {shouldShowSentiment && (
            <SentimentBadge
              sentiment={displaySentiment?.sentiment}
              confidence={displaySentiment?.confidence}
              emotions={displaySentiment?.emotions}
              size="sm"
              showConfidence={false}
              showEmotions={true}
              loading={sentimentLoading || chatMessage?.sentiment_loading}
              onClick={!hasSentiment && !sentimentLoading ? analyzeSentiment : undefined}
            />
          )}
        </div>
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
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </span>
          {shouldShowSentiment && displaySentiment && displaySentiment.keywords && displaySentiment.keywords.length > 0 && (
            <div className="flex items-center gap-1">
              {displaySentiment.keywords.slice(0, 2).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {keyword}
                </Badge>
              ))}
              {displaySentiment.keywords.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{displaySentiment.keywords.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
