
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchLogs, LogEntry } from "@/services/logService";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Logs = () => {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [direction, setDirection] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchLogData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLogs(dateFrom, dateTo, phoneNumber, direction);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch message logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogData();
  }, []);
  
  const handleApplyFilters = () => {
    fetchLogData();
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setPhoneNumber("");
    setDirection(undefined);
    // Fetch without filters after reset
    fetchLogs().then(setLogs).catch(console.error);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Message Logs</h1>
        
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="text"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={direction}
                onValueChange={(value) => setDirection(value)}
              >
                <SelectTrigger id="direction">
                  <SelectValue placeholder="All Messages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="ai">Incoming</SelectItem>
                  <SelectItem value="human">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </div>
        </Card>
        
        <div className="bg-white rounded-md shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sailendra-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Number</th>
                    <th className="px-6 py-3">Message</th>
                    <th className="px-6 py-3">Direction</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          {log.direction === "incoming" ? log.fromNumber : log.toNumber}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {log.message}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.direction === "incoming" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {log.direction === "incoming" ? "Incoming" : "Outgoing"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        No logs found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Logs;
