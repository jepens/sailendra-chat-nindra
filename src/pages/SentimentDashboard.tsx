import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { SentimentDashboard } from '@/components/sentiment/SentimentDashboard';

export function SentimentDashboardPage() {
  return (
    <DashboardLayout title="Sentiment Analysis">
      <div className="p-6">
        <SentimentDashboard />
      </div>
    </DashboardLayout>
  );
}

export default SentimentDashboardPage; 