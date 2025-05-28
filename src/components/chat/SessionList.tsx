import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSession } from "@/types/chat";
import { Loader2 } from "lucide-react";
import { ContactName } from "./ContactName";

interface SessionListProps {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isLoading: boolean;
}

export default function SessionList({
  sessions,
  selectedSessionId,
  onSelectSession,
  isLoading
}: SessionListProps) {
  // Helper function to extract phone number from session name/id
  const extractPhoneNumber = (text: string): string => {
    // Try to extract number from "whatsapp NUMBER" format
    const whatsappMatch = text.match(/whatsapp\s+(\d+)/i);
    if (whatsappMatch) {
      return whatsappMatch[1];
    }
    // If no match, return the original text
    return text;
  };

  if (isLoading) {
    return (
      <div className="w-full md:w-80 border-r bg-gray-100/40 dark:bg-gray-800/40 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 border-r bg-gray-100/40 dark:bg-gray-800/40">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-2 p-4">
          {sessions.map((session) => {
            const phoneNumber = extractPhoneNumber(session.sender_name || session.session_id);
            return (
              <button
                key={session.session_id}
                onClick={() => onSelectSession(session.session_id)}
                className={cn(
                  "flex flex-col gap-1 p-4 rounded-lg",
                  selectedSessionId === session.session_id
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <div className="flex justify-between items-center">
                  <ContactName 
                    phoneNumber={phoneNumber}
                    className="font-medium dark:text-white"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.last_timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {session.last_message}
                </p>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
