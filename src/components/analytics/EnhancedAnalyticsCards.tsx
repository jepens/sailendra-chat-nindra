import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Star, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { enhancedAnalyticsService, EnhancedAnalytics, PeakHourData } from '@/services/enhancedAnalyticsService';
import { useToast } from '@/components/ui/use-toast';

export const EnhancedAnalyticsCards: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<EnhancedAnalytics | null>(null);

  const loadAnalytics = async () => {
    try {
      const data = await enhancedAnalyticsService.getEnhancedAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load enhanced analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load enhanced analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    // Set up polling every 2 minutes for real-time updates
    const interval = setInterval(loadAnalytics, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatResponseTime = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    } else if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get top 3 peak hours for display
  const topPeakHours = analytics.peakHours.slice(0, 3);

  return (
    <>
      {/* Enhanced Analytics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Average Response Time Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Average Response Time
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {formatResponseTime(analytics.averageResponseTime)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Last 24 hours</span>
                <span className={analytics.averageResponseTime <= 5 ? 'text-green-600' : 'text-orange-600'}>
                  {analytics.averageResponseTime <= 5 ? 'Excellent' : 'Good'}
                </span>
              </div>
              <Progress 
                value={Math.min((5 / Math.max(analytics.averageResponseTime, 0.1)) * 100, 100)} 
                className="mt-2 h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction Score Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Customer Satisfaction
            </CardDescription>
            <CardTitle className={`text-2xl font-bold ${getScoreColor(analytics.customerSatisfactionScore)}`}>
              {analytics.customerSatisfactionScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span>Last 7 days</span>
                <span className={getScoreColor(analytics.customerSatisfactionScore)}>
                  {analytics.customerSatisfactionScore >= 80 ? 'Excellent' : 
                   analytics.customerSatisfactionScore >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreProgressColor(analytics.customerSatisfactionScore)}`}
                  style={{ width: `${analytics.customerSatisfactionScore}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Peak Hours
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600">
              {topPeakHours[0]?.hour || '00:00'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div className="space-y-1">
                {topPeakHours.map((peak, index) => (
                  <div key={peak.hour} className="flex items-center justify-between">
                    <span className={index === 0 ? 'font-medium' : ''}>
                      {peak.hour}
                    </span>
                    <span className={`${index === 0 ? 'font-medium text-purple-600' : 'text-gray-500'}`}>
                      {peak.count} msgs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Rate Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Resolution Rate
            </CardDescription>
            <CardTitle className={`text-2xl font-bold ${getScoreColor(analytics.resolutionRate)}`}>
              {analytics.resolutionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span>Last 7 days</span>
                <span className={getScoreColor(analytics.resolutionRate)}>
                  {analytics.resolutionRate >= 80 ? 'Excellent' : 
                   analytics.resolutionRate >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreProgressColor(analytics.resolutionRate)}`}
                  style={{ width: `${analytics.resolutionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Chart */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Message Traffic by Hour
          </CardTitle>
          <CardDescription>
            24-hour message distribution (last 24 hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px'
                  }}
                  formatter={(value) => [`${value} messages`, 'Count']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default EnhancedAnalyticsCards; 