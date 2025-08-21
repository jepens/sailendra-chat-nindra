import { cn } from '@/lib/utils';

interface DateSeparatorProps {
  date: Date;
  className?: string;
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  let displayText: string;
  
  if (isToday) {
    displayText = 'Hari ini';
  } else if (isYesterday) {
    displayText = 'Kemarin';
  } else {
    // Check if it's within the last 7 days
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      displayText = dayNames[date.getDay()];
    } else {
      // Format: DD/MM/YYYY
      displayText = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  return (
    <div className={cn(
      "flex justify-center my-4",
      className
    )}>
      <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
        {displayText}
      </div>
    </div>
  );
}
