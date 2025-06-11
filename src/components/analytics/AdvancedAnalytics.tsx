import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, MessageCircle, Clock, 
  Calendar, Download, Filter, Eye, Target 
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';

interface AnalyticsData {
  overview: {
    totalMessages: number;
    totalConversations: number;
    averageResponseTime: number;
    customerSatisfaction: number;
    messagesTrend: number;
    conversationsTrend: number;
  };
  messagesByHour: Array<{
    hour: string;
    messages: number;
    responses: number;
  }>;
  conversationsByDay: Array<{
    date: string;
    conversations: number;
    completed: number;
  }>;
  platformDistribution: Array<{
    platform: string;
    count: number;
    percentage: number;
  }>;
  responseTimeAnalysis: Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  customerJourney: Array<{
    stage: string;
    count: number;
    conversionRate: number;
  }>;
}

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState('messages');
  const [platform, setPlatform] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, platform]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        overview: {
          totalMessages: 12543,
          totalConversations: 3241,
          averageResponseTime: 3.2,
          customerSatisfaction: 4.6,
          messagesTrend: 12.5,
          conversationsTrend: 8.3,
        },
        messagesByHour: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          messages: Math.floor(Math.random() * 100) + 20,
          responses: Math.floor(Math.random() * 80) + 15,
        })),
        conversationsByDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          conversations: Math.floor(Math.random() * 50) + 10,
          completed: Math.floor(Math.random() * 40) + 8,
        })),
        platformDistribution: [
          { platform: 'WhatsApp', count: 8500, percentage: 68 },
          { platform: 'Facebook', count: 2100, percentage: 17 },
          { platform: 'Instagram', count: 1200, percentage: 10 },
          { platform: 'Telegram', count: 600, percentage: 5 },
        ],
        responseTimeAnalysis: [
          { timeRange: '< 1 min', count: 1500, percentage: 46 },
          { timeRange: '1-5 min', count: 1000, percentage: 31 },
          { timeRange: '5-15 min', count: 500, percentage: 15 },
          { timeRange: '> 15 min', count: 241, percentage: 8 },
        ],
        topKeywords: [
          { keyword: 'produk', count: 450, sentiment: 'neutral' },
          { keyword: 'harga', count: 380, sentiment: 'neutral' },
          { keyword: 'terima kasih', count: 320, sentiment: 'positive' },
          { keyword: 'masalah', count: 280, sentiment: 'negative' },
          { keyword: 'bantuan', count: 250, sentiment: 'neutral' },
        ],
        customerJourney: [
          { stage: 'Awareness', count: 1000, conversionRate: 100 },
          { stage: 'Interest', count: 750, conversionRate: 75 },
          { stage: 'Consideration', count: 500, conversionRate: 50 },
          { stage: 'Purchase', count: 250, conversionRate: 25 },
          { stage: 'Retention', count: 200, conversionRate: 20 },
        ],
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your chatbot performance</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Messages</CardDescription>
            <CardTitle className="text-2xl">{data.overview.totalMessages.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+{data.overview.messagesTrend}%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Conversations</CardDescription>
            <CardTitle className="text-2xl">{data.overview.totalConversations.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+{data.overview.conversationsTrend}%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-2xl">{data.overview.averageResponseTime}m</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">-15%</span>
              <span className="text-muted-foreground ml-1">faster</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customer Satisfaction</CardDescription>
            <CardTitle className="text-2xl">{data.overview.customerSatisfaction}/5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+0.2</span>
              <span className="text-muted-foreground ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Messages by Hour</CardTitle>
                <CardDescription>Daily activity pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.messagesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="messages" fill="#0EA5E9" name="Messages" />
                    <Bar dataKey="responses" fill="#10B981" name="Responses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversations Trend</CardTitle>
                <CardDescription>Daily conversation volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.conversationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="#0EA5E9" 
                      fill="#0EA5E9" 
                      fillOpacity={0.3}
                      name="New Conversations"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Messages by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.platformDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ platform, percentage }) => `${platform}: ${percentage}%`}
                    >
                      {data.platformDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Messages and engagement by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.platformDistribution.map((platform, index) => (
                    <div key={platform.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{platform.platform}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {platform.count.toLocaleString()} messages
                        </span>
                        <Badge variant="secondary">{platform.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analysis</CardTitle>
                <CardDescription>Distribution of response times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.responseTimeAnalysis} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="timeRange" type="category" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0EA5E9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>First Response Rate</span>
                    <Badge variant="outline">94%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Resolution Rate</span>
                    <Badge variant="outline">87%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer Satisfaction</span>
                    <Badge variant="outline">4.6/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Session Duration</span>
                    <Badge variant="outline">8.5 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords & Sentiment</CardTitle>
              <CardDescription>Most frequently mentioned keywords with sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topKeywords.map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{index + 1}</span>
                      <span>{keyword.keyword}</span>
                      <Badge 
                        variant={
                          keyword.sentiment === 'positive' ? 'default' :
                          keyword.sentiment === 'negative' ? 'destructive' : 'secondary'
                        }
                      >
                        {keyword.sentiment}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {keyword.count} mentions
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey</CardTitle>
              <CardDescription>Conversion funnel analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.customerJourney}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0EA5E9" name="Users" />
                  <Bar dataKey="conversionRate" fill="#10B981" name="Conversion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics; 