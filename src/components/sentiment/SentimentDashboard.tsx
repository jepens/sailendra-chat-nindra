import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  MessageSquare, 
  DollarSign,
  Download,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { hybridSentimentService } from '@/services/hybridSentimentService';
import { openaiSentimentService } from '@/services/openaiSentimentService';
import { SentimentStats, SentimentFilter } from '@/types/sentiment';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';

interface DashboardProps {
  className?: string;
}

export function SentimentDashboard({ className }: DashboardProps) {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Set default date range to last 7 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      from: sevenDaysAgo,
      to: today
    };
  });
  
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ processed: 0, total: 0, cost: 0 });

  // Debug function to check database content
  const debugDatabaseContent = async () => {
    try {
      console.log('🔍 Debugging database content...');
      
      // Check sentiment_analysis table
      const { data: sentimentData, error: sentimentError, count } = await supabase
        .from('sentiment_analysis')
        .select('*', { count: 'exact' })
        .limit(10);

      if (sentimentError) {
        console.error('❌ Error fetching sentiment data:', sentimentError);
      } else {
        console.log('📊 Sentiment Analysis Table:');
        console.log('Total records:', count);
        console.log('Sample data:', sentimentData);
      }

      // Check n8n_chat_histories table
      const { data: chatData, error: chatError, count: chatCount } = await supabase
        .from('n8n_chat_histories')
        .select('*', { count: 'exact' })
        .limit(5);

      if (chatError) {
        console.error('❌ Error fetching chat data:', chatError);
      } else {
        console.log('💬 Chat Histories Table:');
        console.log('Total records:', chatCount);
        console.log('Sample data:', chatData);
      }

    } catch (error) {
      console.error('🚨 Debug failed:', error);
    }
  };

  // Load sentiment statistics
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading sentiment statistics...');
      
      const filter: SentimentFilter = {};
      
      if (dateRange?.from) {
        filter.date_from = dateRange.from.toISOString();
        console.log('Date filter from:', filter.date_from);
      }
      if (dateRange?.to) {
        filter.date_to = dateRange.to.toISOString();
        console.log('Date filter to:', filter.date_to);
      }
      if (selectedSession) {
        filter.session_id = selectedSession;
        console.log('Session filter:', filter.session_id);
      }

      console.log('Fetching sentiment stats with filter:', filter);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('sentiment_analysis')
        .select('count', { count: 'exact' })
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('Supabase connection test successful');
      
      // Debug database content
      await debugDatabaseContent();

      const [sentimentStats, dailyUsage] = await Promise.all([
        hybridSentimentService.getSentimentStats(filter),
        hybridSentimentService.getDailyStats()
      ]);

      console.log('Sentiment stats loaded:', sentimentStats);
      console.log('Daily usage loaded:', dailyUsage);

      setStats(sentimentStats);
      setDailyStats(dailyUsage);
    } catch (error) {
      console.error('Failed to load sentiment stats:', error);
      toast.error(`Gagal memuat statistik sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Set empty stats as fallback
      setStats({
        total_messages: 0,
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        positive_percentage: 0,
        negative_percentage: 0,
        neutral_percentage: 0,
        average_confidence: 0,
        top_emotions: [],
        sentiment_trend: []
      });
      
      setDailyStats({
        totalProcessed: 0,
        openaiUsed: 0,
        localUsed: 0,
        totalTokens: 0,
        totalCostUSD: 0,
        remainingCost: 5.0,
        remainingTokens: 50000
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, selectedSession]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // Start batch processing for historical data
  const startBatchProcessing = async () => {
    try {
      setBatchProcessing(true);
      setBatchProgress({ processed: 0, total: 0, cost: 0 });

      toast.info('Memulai batch processing untuk historical data...');
      
      // Get recent chat messages (last 100)
      const { data: chatMessages, error: chatError } = await supabase
        .from('n8n_chat_histories')
        .select(`
          id,
          session_id,
          message,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (chatError) {
        throw new Error(`Failed to fetch chat messages: ${chatError.message}`);
      }

      if (!chatMessages || chatMessages.length === 0) {
        toast.info('Tidak ada pesan untuk dianalisis');
        return;
      }

      // Get already analyzed message IDs
      const { data: analyzedMessages, error: analyzedError } = await supabase
        .from('sentiment_analysis')
        .select('message_id');

      if (analyzedError) {
        console.warn('Could not fetch analyzed messages:', analyzedError);
      }

      const analyzedMessageIds = new Set(analyzedMessages?.map(m => m.message_id) || []);

      // Filter out messages that are already analyzed
      const unanalyzedMessages = chatMessages.filter(msg => 
        !analyzedMessageIds.has(msg.id)
      );

      if (unanalyzedMessages.length === 0) {
        toast.info('Semua pesan sudah dianalisis');
        return;
      }

      const totalMessages = unanalyzedMessages.length;
      setBatchProgress({ processed: 0, total: totalMessages, cost: 0 });

      let totalCost = 0;
      let processed = 0;
      let successful = 0;

      for (const message of unanalyzedMessages) {
        try {
          // Extract human message content from the message JSON
          const messageData = message.message as any;
          let messageContent = '';
          
          // Handle different message formats
          if (typeof messageData === 'object' && messageData !== null) {
            if (messageData.input && typeof messageData.input === 'string') {
              messageContent = messageData.input;
            } else if (messageData.text && typeof messageData.text === 'string') {
              messageContent = messageData.text;
            } else if (messageData.content && typeof messageData.content === 'string') {
              messageContent = messageData.content;
            } else if (messageData.message && typeof messageData.message === 'string') {
              messageContent = messageData.message;
            }
          } else if (typeof messageData === 'string') {
            messageContent = messageData;
          }

          // Skip if no valid message content
          if (!messageContent || messageContent.trim().length < 3) {
            console.log(`Skipping message ${message.id}: No valid content`);
            processed++;
            setBatchProgress({ processed, total: totalMessages, cost: totalCost });
            continue;
          }

          // Skip bot messages (usually longer and more formal)
          if (messageContent.includes('Berdasarkan') || 
              messageContent.includes('sistem') || 
              messageContent.includes('AI') ||
              messageContent.includes('chatbot') ||
              messageContent.length > 500) {
            console.log(`Skipping message ${message.id}: Appears to be bot message`);
            processed++;
            setBatchProgress({ processed, total: totalMessages, cost: totalCost });
            continue;
          }

          // Analyze the message using hybrid sentiment service
          await hybridSentimentService.analyzeMessage(
            message.id.toString(),
            message.session_id,
            messageContent
          );

          // Estimate cost for this analysis (rough calculation)
          const estimatedTokens = messageContent.length / 4; // Rough estimate
          const estimatedCost = estimatedTokens * 0.0000015;
          totalCost += estimatedCost;
          successful++;

          processed++;
          setBatchProgress({ 
            processed, 
            total: totalMessages, 
            cost: totalCost 
          });

          // Add small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (messageError) {
          console.error(`Failed to analyze message ${message.id}:`, messageError);
          processed++;
          setBatchProgress({ 
            processed, 
            total: totalMessages, 
            cost: totalCost 
          });
        }
      }

      toast.success(`Batch processing selesai! ${successful} dari ${processed} pesan berhasil dianalisis.`);
      await loadStats(); // Refresh the dashboard

    } catch (error) {
      console.error('Batch processing failed:', error);
      toast.error(`Batch processing gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Export data to Excel
  const exportToExcel = async () => {
    try {
      toast.info('Mempersiapkan export data...');
      
      // Get all sentiment data based on current filters
      const filter: SentimentFilter = {};
      if (dateRange?.from) {
        filter.date_from = dateRange.from.toISOString();
      }
      if (dateRange?.to) {
        filter.date_to = dateRange.to.toISOString();
      }
      if (selectedSession) {
        filter.session_id = selectedSession;
      }

      // Get detailed sentiment data for export
      let query = supabase
        .from('sentiment_analysis')
        .select(`
          id,
          message_id,
          session_id,
          message_content,
          sentiment,
          confidence_score,
          emotions,
          keywords,
          analysis_provider,
          tokens_used,
          analyzed_at,
          created_at
        `);

      // Apply filters
      if (filter.session_id) {
        query = query.eq('session_id', filter.session_id);
      }
      if (filter.date_from) {
        query = query.gte('analyzed_at', filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte('analyzed_at', filter.date_to);
      }

      const { data: sentimentData, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      if (!sentimentData || sentimentData.length === 0) {
        toast.warning('Tidak ada data untuk diexport');
        return;
      }

      // Prepare data for Excel
      const excelData = sentimentData.map(item => ({
        'ID': item.id,
        'Message ID': item.message_id,
        'Session ID': item.session_id,
        'Message Content': item.message_content,
        'Sentiment': item.sentiment,
        'Confidence Score': item.confidence_score,
        'Emotions': item.emotions ? JSON.stringify(item.emotions) : '',
        'Keywords': item.keywords ? item.keywords.join(', ') : '',
        'Analysis Provider': item.analysis_provider,
        'Tokens Used': item.tokens_used || 0,
        'Analyzed At': new Date(item.analyzed_at || '').toLocaleString(),
        'Created At': new Date(item.created_at || '').toLocaleString()
      }));

      // Create CSV content
      const headers = Object.keys(excelData[0]);
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sentiment_analysis_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data berhasil diexport ke Excel (CSV)');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export data to PDF
  const exportToPDF = async () => {
    try {
      toast.info('Mempersiapkan export PDF...');
      
      // Get summary statistics
      const summaryStats = await hybridSentimentService.getSentimentStats();
      const dailyUsage = await hybridSentimentService.getDailyStats();

      // Create PDF content as HTML string
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sentiment Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-title { font-weight: bold; color: #333; margin-bottom: 10px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .emotions-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .emotions-table th, .emotions-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .emotions-table th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sentiment Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Messages</div>
              <div class="stat-value">${summaryStats.total_messages.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Positive Sentiment</div>
              <div class="stat-value">${summaryStats.positive_percentage.toFixed(1)}%</div>
              <div>${summaryStats.positive_count} messages</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Negative Sentiment</div>
              <div class="stat-value">${summaryStats.negative_percentage.toFixed(1)}%</div>
              <div>${summaryStats.negative_count} messages</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Neutral Sentiment</div>
              <div class="stat-value">${summaryStats.neutral_percentage.toFixed(1)}%</div>
              <div>${summaryStats.neutral_count} messages</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Daily Usage Statistics</div>
            <p><strong>Total Processed Today:</strong> ${dailyUsage.totalProcessed}</p>
            <p><strong>OpenAI Used:</strong> ${dailyUsage.openaiUsed}</p>
            <p><strong>Local Analysis:</strong> ${dailyUsage.localUsed}</p>
            <p><strong>Total Tokens:</strong> ${dailyUsage.totalTokens.toLocaleString()}</p>
            <p><strong>Estimated Cost:</strong> $${dailyUsage.totalCostUSD.toFixed(4)}</p>
          </div>

          <h3>Top Emotions</h3>
          <table class="emotions-table">
            <thead>
              <tr>
                <th>Emotion</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${summaryStats.top_emotions.map(emotion => `
                <tr>
                  <td>${emotion.emotion}</td>
                  <td>${emotion.count}</td>
                  <td>${emotion.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Report generated by Sailendra Chat Nexus - Sentiment Analysis System</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window with the PDF content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
        
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }

      toast.success('Report PDF berhasil digenerate');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Export PDF gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading sentiment data...</span>
        </div>
      </div>
    );
  }

  const satisfactionScore = stats ? 
    (stats.positive_percentage / (stats.positive_percentage + stats.negative_percentage)) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sentiment Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Analisis sentiment untuk customer messages dengan OpenAI GPT-3.5-turbo
          </p>
          {stats && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleString()} • {stats.total_messages} messages analyzed
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" onClick={debugDatabaseContent}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Debug DB
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Cost and Usage Monitoring */}
      {dailyStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Daily OpenAI Usage & Cost Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Cost</span>
                  <Badge variant={dailyStats.totalCostUSD > 4 ? "destructive" : "secondary"}>
                    ${dailyStats.totalCostUSD.toFixed(4)}
                  </Badge>
                </div>
                <Progress 
                  value={(dailyStats.totalCostUSD / 5) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: ${dailyStats.remainingCost.toFixed(4)} / $5.00
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tokens Used</span>
                  <Badge variant="secondary">
                    {dailyStats.totalTokens.toLocaleString()}
                  </Badge>
                </div>
                <Progress 
                  value={(dailyStats.totalTokens / 50000) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: {dailyStats.remainingTokens.toLocaleString()} / 50k
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analysis Method</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>OpenAI: {dailyStats.openaiUsed}</span>
                    <span>Local: {dailyStats.localUsed}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Processed</span>
                  <Badge variant="outline">
                    {dailyStats.totalProcessed}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Batch Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range"
              />
            </div>
            
            <Button 
              onClick={startBatchProcessing} 
              disabled={batchProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {batchProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Process Historical Data
                </>
              )}
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {batchProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Messages...</span>
                <span>{batchProgress.processed} / {batchProgress.total}</span>
              </div>
              <Progress 
                value={batchProgress.total > 0 ? (batchProgress.processed / batchProgress.total) * 100 : 0} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Estimated Cost: ${batchProgress.cost.toFixed(4)}</span>
                <span>{Math.round((batchProgress.processed / batchProgress.total) * 100)}% Complete</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Customer messages analyzed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {satisfactionScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on sentiment analysis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.positive_percentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.positive_count} positive messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.negative_percentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.negative_count} negative messages
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sentiment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>
                  Distribution of customer sentiment over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">😊 Positive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{stats.positive_count}</span>
                      <Badge variant="secondary">{stats.positive_percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={stats.positive_percentage} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium">😐 Neutral</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{stats.neutral_count}</span>
                      <Badge variant="outline">{stats.neutral_percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={stats.neutral_percentage} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">😞 Negative</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{stats.negative_count}</span>
                      <Badge variant="destructive">{stats.negative_percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={stats.negative_percentage} className="h-2" />
                </div>

                <Separator />
                
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Overall Customer Mood</div>
                  <div className="text-2xl">
                    {stats.positive_percentage > 50 ? '😄 Very Happy' :
                     stats.positive_percentage > 30 ? '😊 Happy' :
                     stats.negative_percentage > 20 ? '😞 Needs Attention' :
                     '😐 Neutral'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(stats.average_confidence * 100).toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">Average Confidence</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">OpenAI + Local</div>
                    <p className="text-sm text-muted-foreground">Hybrid Analysis</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dailyStats ? dailyStats.totalProcessed : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Messages Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emotions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Emotions Detected</CardTitle>
                <CardDescription>
                  Most common emotions in customer messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.top_emotions.map((emotion, index) => (
                    <div key={emotion.emotion} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium capitalize">{emotion.emotion}</p>
                          <p className="text-sm text-muted-foreground">{emotion.count} occurrences</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{emotion.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trends</CardTitle>
                <CardDescription>
                  Daily sentiment distribution over the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.sentiment_trend.map((day) => (
                    <div key={day.date} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{day.date}</span>
                        <span className="text-muted-foreground">
                          Total: {day.positive + day.negative + day.neutral}
                        </span>
                      </div>
                      <div className="flex space-x-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ 
                            width: `${(day.positive / (day.positive + day.negative + day.neutral)) * 100}%` 
                          }}
                        />
                        <div 
                          className="bg-gray-400" 
                          style={{ 
                            width: `${(day.neutral / (day.positive + day.negative + day.neutral)) * 100}%` 
                          }}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ 
                            width: `${(day.negative / (day.positive + day.negative + day.neutral)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-600">+{day.positive}</span>
                        <span className="text-gray-600">={day.neutral}</span>
                        <span className="text-red-600">-{day.negative}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            {/* Session Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Session Analysis</CardTitle>
                <CardDescription>
                  Sentiment analysis per customer session (WhatsApp number)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && stats.total_messages > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Analisis berdasarkan {stats.total_messages} pesan dari berbagai sesi customer
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Total Sessions Active</div>
                        <div className="text-2xl font-bold">Multiple</div>
                        <div className="text-xs text-muted-foreground">
                          Based on processed messages
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Average Messages per Session</div>
                        <div className="text-2xl font-bold">
                          {Math.round(stats.total_messages / Math.max(1, Math.ceil(stats.total_messages / 10)))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Estimated based on message distribution
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Most Common Sentiment</div>
                        <div className="text-2xl font-bold">
                          {stats.neutral_count > stats.positive_count && stats.neutral_count > stats.negative_count ? 'Neutral' :
                           stats.positive_count > stats.negative_count ? 'Positive' : 'Negative'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Across all sessions
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Session Insights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Positive Interactions:</span>
                            <span className="font-medium text-green-600">{stats.positive_count} messages</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Neutral Interactions:</span>
                            <span className="font-medium text-blue-600">{stats.neutral_count} messages</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Negative Interactions:</span>
                            <span className="font-medium text-red-600">{stats.negative_count} messages</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Analysis Confidence:</span>
                            <span className="font-medium">{(stats.average_confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Quality:</span>
                            <span className="font-medium text-green-600">
                              {stats.average_confidence >= 0.8 ? 'Excellent' : 
                               stats.average_confidence >= 0.6 ? 'Good' : 'Fair'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={startBatchProcessing} 
                      disabled={batchProcessing}
                      className="w-full"
                    >
                      {batchProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing More Sessions...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Process Additional Sessions
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-muted-foreground mb-4">Session-level analysis will be available after batch processing</p>
                    <Button 
                      onClick={startBatchProcessing} 
                      disabled={batchProcessing}
                    >
                      Start Processing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 