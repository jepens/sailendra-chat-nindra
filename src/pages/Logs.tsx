
import React, { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LogEntry {
  id: string;
  waId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  messageType: string;
  direction: "incoming" | "outgoing";
  timestamp: string;
  status: string;
}

const Logs = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [direction, setDirection] = useState<string | undefined>(undefined);
  
  // Mock data for logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log1",
      waId: "62812345678",
      fromNumber: "+62 812-3456-78",
      toNumber: "whatsapp",
      message: "Hello, I have a question about your services",
      messageType: "text",
      direction: "incoming",
      timestamp: "2023-05-19T10:23:00Z",
      status: "read"
    },
    {
      id: "log2",
      waId: "62812345678",
      fromNumber: "whatsapp",
      toNumber: "+62 812-3456-78",
      message: "Hi John, how can I help you today?",
      messageType: "text",
      direction: "outgoing",
      timestamp: "2023-05-19T10:25:00Z",
      status: "delivered"
    },
    {
      id: "log3",
      waId: "62898765432",
      fromNumber: "+62 898-7654-32",
      toNumber: "whatsapp",
      message: "I've been trying to access my account",
      messageType: "text",
      direction: "incoming",
      timestamp: "2023-05-19T09:40:00Z",
      status: "read"
    },
    {
      id: "log4",
      waId: "62898765432",
      fromNumber: "whatsapp",
      toNumber: "+62 898-7654-32",
      message: "Could you please provide your account email so I can check?",
      messageType: "text",
      direction: "outgoing",
      timestamp: "2023-05-19T09:42:00Z",
      status: "delivered"
    },
    {
      id: "log5",
      waId: "62856781234",
      fromNumber: "+62 856-7812-34",
      toNumber: "whatsapp",
      message: "I'd like to schedule a meeting",
      messageType: "text",
      direction: "incoming",
      timestamp: "2023-05-18T16:30:00Z",
      status: "read"
    }
  ]);
  
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
  
  // Filter logs based on search criteria
  const filteredLogs = logs.filter(log => {
    const matchesPhone = !phoneNumber || 
      log.fromNumber.includes(phoneNumber) || 
      log.toNumber.includes(phoneNumber);
    
    const matchesDirection = !direction || log.direction === direction;
    
    let matchesDate = true;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const logDate = new Date(log.timestamp);
      if (fromDate > logDate) matchesDate = false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of the selected day
      const logDate = new Date(log.timestamp);
      if (toDate < logDate) matchesDate = false;
    }
    
    return matchesPhone && matchesDirection && matchesDate;
  });
  
  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setPhoneNumber("");
    setDirection(undefined);
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
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>Reset</Button>
            <Button>Apply Filters</Button>
          </div>
        </Card>
        
        <div className="bg-white rounded-md shadow overflow-hidden">
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
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Logs;
