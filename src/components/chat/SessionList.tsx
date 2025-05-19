
import { useState } from 'react';
import { ChatSession } from '@/types/chat';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { Search, User } from 'lucide-react';

interface SessionListProps {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
}

const SessionList = ({ sessions, selectedSessionId, onSelectSession, isLoading }: SessionListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session => 
    session.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.sender_name && session.sender_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full md:w-80 lg:w-96 border-r bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No sessions found</div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.session_id}
              className={`
                chat-list-item dark:hover:bg-gray-700 dark:border-gray-700
                ${selectedSessionId === session.session_id ? 
                  'active dark:bg-gray-700 dark:border-l-sailendra-500' : ''}
              `}
              onClick={() => onSelectSession(session.session_id)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-white">
                      {session.sender_name || session.session_id}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(session.last_timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                      {session.last_message}
                    </span>
                    {session.unread_count && session.unread_count > 0 && (
                      <span className="bg-sailendra-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {session.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionList;
