import { Button } from "@/components/ui/button";
import { CalendarView } from "@/types/calendar";
import { ChevronLeft, ChevronRight, Calendar, Grid, List, Clock } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onNavigate
}: CalendarHeaderProps) => {
  const getDateFormat = () => {
    switch (view) {
      case 'month':
        return 'MMMM yyyy';
      case 'week':
        return 'MMM dd, yyyy';
      case 'day':
        return 'EEEE, MMM dd, yyyy';
      default:
        return 'MMMM yyyy';
    }
  };

  const getViewIcon = (viewType: CalendarView) => {
    switch (viewType) {
      case 'month':
        return <Grid className="h-4 w-4" />;
      case 'week':
        return <Calendar className="h-4 w-4" />;
      case 'day':
        return <Clock className="h-4 w-4" />;
      case 'agenda':
        return <List className="h-4 w-4" />;
      default:
        return <Grid className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
        >
          Today
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentDate, getDateFormat())}
          </h2>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((viewType) => (
          <Button
            key={viewType}
            variant={view === viewType ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(viewType)}
            className="flex items-center space-x-2"
          >
            {getViewIcon(viewType)}
            <span className="capitalize">{viewType}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}; 