import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Smile, 
  Frown, 
  Meh, 
  Heart, 
  Angry, 
  Zap,
  Eye,
  Loader2
} from 'lucide-react';
import { SentimentType, EmotionType, SentimentAnalysis } from '@/types/sentiment';
import { cn } from '@/lib/utils';

interface SentimentBadgeProps {
  sentiment?: SentimentType;
  confidence?: number;
  emotions?: { [key in EmotionType]?: number };
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  showEmotions?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const getSentimentIcon = (sentiment: SentimentType) => {
  switch (sentiment) {
    case 'positive':
      return <Smile className="w-3 h-3" />;
    case 'negative':
      return <Frown className="w-3 h-3" />;
    case 'neutral':
    default:
      return <Meh className="w-3 h-3" />;
  }
};

const getSentimentColor = (sentiment: SentimentType) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'negative':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    case 'neutral':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  }
};

const getEmotionIcon = (emotion: EmotionType) => {
  switch (emotion) {
    case 'joy':
      return <Smile className="w-3 h-3" />;
    case 'anger':
      return <Angry className="w-3 h-3" />;
    case 'fear':
      return <Zap className="w-3 h-3" />;
    case 'sadness':
      return <Frown className="w-3 h-3" />;
    case 'surprise':
      return <Eye className="w-3 h-3" />;
    case 'trust':
      return <Heart className="w-3 h-3" />;
    default:
      return <Meh className="w-3 h-3" />;
  }
};

const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'text-xs px-1.5 py-0.5';
    case 'lg':
      return 'text-sm px-3 py-1.5';
    case 'md':
    default:
      return 'text-xs px-2 py-1';
  }
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  confidence,
  emotions,
  size = 'md',
  showConfidence = true,
  showEmotions = false,
  loading = false,
  className,
  onClick
}) => {
  if (loading) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'inline-flex items-center gap-1 cursor-default',
          getSizeClasses(size),
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Analyzing...</span>
      </Badge>
    );
  }

  if (!sentiment) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          'inline-flex items-center gap-1 cursor-pointer text-gray-500',
          getSizeClasses(size),
          className
        )}
        onClick={onClick}
      >
        <Eye className="w-3 h-3" />
        <span>Analyze</span>
      </Badge>
    );
  }

  const badgeContent = (
    <Badge 
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 cursor-default border transition-colors',
        getSentimentColor(sentiment),
        getSizeClasses(size),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {getSentimentIcon(sentiment)}
      <span className="capitalize">{sentiment}</span>
      {showConfidence && confidence && (
        <span className="text-xs opacity-75">
          ({formatConfidence(confidence)})
        </span>
      )}
    </Badge>
  );

  if (!showEmotions || !emotions || Object.keys(emotions).length === 0) {
    return badgeContent;
  }

  // Sort emotions by intensity
  const sortedEmotions = Object.entries(emotions)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3); // Show top 3 emotions

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div className="font-medium text-xs">
              Sentiment: {sentiment} ({confidence && formatConfidence(confidence)})
            </div>
            {sortedEmotions.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Top Emotions:</div>
                <div className="space-y-1">
                  {sortedEmotions.map(([emotion, intensity]) => (
                    <div key={emotion} className="flex items-center gap-2 text-xs">
                      {getEmotionIcon(emotion as EmotionType)}
                      <span className="capitalize">{emotion}</span>
                      <span className="opacity-75">
                        {Math.round((intensity as number) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Simplified version for quick sentiment display
export const SimpleSentimentBadge: React.FC<{
  sentiment: SentimentAnalysis;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ sentiment, size = 'sm', className }) => {
  return (
    <SentimentBadge
      sentiment={sentiment.sentiment}
      confidence={sentiment.confidence}
      emotions={sentiment.emotions}
      size={size}
      showConfidence={false}
      showEmotions={true}
      className={className}
    />
  );
};

// Loading version
export const SentimentBadgeLoading: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  return (
    <SentimentBadge
      loading={true}
      size={size}
      className={className}
    />
  );
};

export default SentimentBadge; 