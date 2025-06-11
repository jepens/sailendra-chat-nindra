import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardStats, getStatsComparison, DashboardStats } from "@/services/dashboardService";
import { recentConversationsService, RecentConversation } from "@/services/recentConversationsService";
import { systemStatusService, SystemStatus } from "@/services/systemStatusService";
import "@/services/initializeSystemStatus"; // Initialize system status settings
import { Loader2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EnhancedAnalyticsCards from "@/components/analytics/EnhancedAnalyticsCards";

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparison, setComparison] = useState<{
    conversations: number;
    active: number;
    messages: number;
    response: number;
  } | null>(null);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const loadDashboardData = async () => {
    try {
      const [statsData, comparisonData, conversationsData, systemStatusData] = await Promise.all([
        fetchDashboardStats(),
        getStatsComparison(),
        recentConversationsService.getRecentConversations(3),
        systemStatusService.getSystemStatus()
      ]);
      
      setStats(statsData);
      setComparison(comparisonData);
      setRecentConversations(conversationsData);
      setSystemStatus(systemStatusData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up polling every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats || !comparison || !systemStatus) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-sailendra-500" />
        </div>
      </DashboardLayout>
    );
  }

  const dashboardStats = [
    {
      title: "Total Conversations",
      value: stats.totalConversations.toString(),
      trend: comparison.conversations >= 0 ? "up" : "down",
      percent: `${Math.abs(comparison.conversations)}%`
    },
    {
      title: "Active Today",
      value: stats.activeToday.toString(),
      trend: comparison.active >= 0 ? "up" : "down",
      percent: `${Math.abs(comparison.active)}%`
    },
    {
      title: "Messages Received",
      value: stats.messagesReceived.toString(),
      trend: comparison.messages >= 0 ? "up" : "down",
      percent: `${Math.abs(comparison.messages)}%`
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      trend: comparison.response >= 0 ? "up" : "down",
      percent: `${Math.abs(comparison.response)}%`
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Enhanced Analytics Cards */}
        <EnhancedAnalyticsCards />
        
        {/* Basic Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {dashboardStats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-sm flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? (
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span>{stat.percent} from last week</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Latest customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentConversations.length > 0 ? (
                  recentConversations.map((conversation, i) => (
                    <div key={conversation.session_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-sm">{conversation.contact_identifier}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {conversation.last_message.length > 50 
                              ? conversation.last_message.substring(0, 50) + '...' 
                              : conversation.last_message}
                          </div>
                          <div className="text-xs text-gray-400">{conversation.last_activity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {conversation.new_messages_count > 0 && (
                          <div className="text-xs bg-blue-500 text-white rounded-full px-2 py-1">
                            {conversation.new_messages_count} new
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent conversations</p>
                    <p className="text-xs text-gray-400">New conversations will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">WhatsApp API Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatusService.getStatusDisplay(systemStatus.whatsappApiStatus, 'api').bgColor
                  } ${
                    systemStatusService.getStatusDisplay(systemStatus.whatsappApiStatus, 'api').textColor
                  }`}>
                    {systemStatusService.getStatusDisplay(systemStatus.whatsappApiStatus, 'api').label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Webhook Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatusService.getStatusDisplay(systemStatus.webhookStatus, 'webhook').bgColor
                  } ${
                    systemStatusService.getStatusDisplay(systemStatus.webhookStatus, 'webhook').textColor
                  }`}>
                    {systemStatusService.getStatusDisplay(systemStatus.webhookStatus, 'webhook').label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Database Connection</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatusService.getStatusDisplay(systemStatus.databaseConnection, 'database').bgColor
                  } ${
                    systemStatusService.getStatusDisplay(systemStatus.databaseConnection, 'database').textColor
                  }`}>
                    {systemStatusService.getStatusDisplay(systemStatus.databaseConnection, 'database').label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last System Update</span>
                  <span className="text-gray-600">{systemStatus.lastSystemUpdate}</span>
                </div>
                {systemStatus.systemHealth !== 'healthy' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">System Health</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      systemStatus.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {systemStatus.systemHealth.charAt(0).toUpperCase() + systemStatus.systemHealth.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
