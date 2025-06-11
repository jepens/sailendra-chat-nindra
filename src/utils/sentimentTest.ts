import { sentimentService } from '@/services/sentimentAnalyzer';
import { logger } from '@/utils/logger';

// Test messages in Indonesian and English
const testMessages = [
  {
    id: '1',
    sessionId: 'test-session-1',
    content: 'Terima kasih banyak! Pelayanan sangat bagus dan memuaskan',
    expected: 'positive'
  },
  {
    id: '2',
    sessionId: 'test-session-1',
    content: 'Saya sangat kecewa dengan layanan ini. Lambat dan tidak membantu',
    expected: 'negative'
  },
  {
    id: '3',
    sessionId: 'test-session-1',
    content: 'Halo, saya ingin bertanya tentang produk',
    expected: 'neutral'
  },
  {
    id: '4',
    sessionId: 'test-session-1',
    content: 'This is amazing! I love it so much, great service!',
    expected: 'positive'
  },
  {
    id: '5',
    sessionId: 'test-session-1',
    content: 'This is terrible, worst experience ever. Very disappointed.',
    expected: 'negative'
  },
  {
    id: '6',
    sessionId: 'test-session-1',
    content: 'Can you help me with my order?',
    expected: 'neutral'
  },
  {
    id: '7',
    sessionId: 'test-session-1',
    content: 'Saya marah dengan pelayanan yang buruk ini!',
    expected: 'negative'
  },
  {
    id: '8',
    sessionId: 'test-session-1',
    content: 'Senang sekali berbelanja di sini, ramah dan cepat',
    expected: 'positive'
  }
];

export async function testSentimentAnalysis() {
  console.log('🧪 Starting Sentiment Analysis Tests...\n');
  
  let correct = 0;
  let total = testMessages.length;
  const results = [];

  for (const testMessage of testMessages) {
    try {
      console.log(`Testing: "${testMessage.content}"`);
      
      const analysis = await sentimentService.analyzeMessage(
        testMessage.id,
        testMessage.sessionId,
        testMessage.content
      );

      const isCorrect = analysis.sentiment === testMessage.expected;
      if (isCorrect) correct++;

      results.push({
        message: testMessage.content,
        expected: testMessage.expected,
        predicted: analysis.sentiment,
        confidence: analysis.confidence,
        emotions: analysis.emotions,
        keywords: analysis.keywords,
        correct: isCorrect
      });

      console.log(`✓ Expected: ${testMessage.expected}, Got: ${analysis.sentiment} (${Math.round(analysis.confidence * 100)}%)`);
      if (analysis.keywords && analysis.keywords.length > 0) {
        console.log(`  Keywords: ${analysis.keywords.join(', ')}`);
      }
      console.log('');

    } catch (error) {
      console.error(`❌ Error analyzing message ${testMessage.id}:`, error);
      results.push({
        message: testMessage.content,
        expected: testMessage.expected,
        predicted: 'error',
        confidence: 0,
        correct: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const accuracy = (correct / total) * 100;
  
  console.log('📊 Test Results Summary:');
  console.log(`Accuracy: ${accuracy.toFixed(1)}% (${correct}/${total})`);
  console.log('\n📋 Detailed Results:');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.correct ? '✅' : '❌'} "${result.message.substring(0, 50)}..."`);
    console.log(`   Expected: ${result.expected}, Got: ${result.predicted}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  return {
    accuracy,
    correct,
    total,
    results
  };
}

export async function demonstrateSentimentFeatures() {
  console.log('🎯 Demonstrating Sentiment Analysis Features...\n');

  // Test single analysis
  console.log('1. Single Message Analysis:');
  const singleResult = await sentimentService.analyzeSentiment(
    'Produk ini luar biasa! Saya sangat puas dan akan merekomendasikan ke teman-teman'
  );
  console.log('Result:', singleResult);
  console.log('');

  // Test batch analysis
  console.log('2. Batch Analysis:');
  const batchMessages = testMessages.slice(0, 3).map(msg => ({
    message_id: msg.id,
    session_id: msg.sessionId,
    content: msg.content
  }));

  const batchResults = await sentimentService.analyzeBatch(batchMessages);
  console.log(`Analyzed ${batchResults.length} messages in batch`);
  batchResults.forEach(result => {
    console.log(`- ${result.sentiment} (${Math.round(result.confidence * 100)}%): ${result.message_id}`);
  });
  console.log('');

  // Test statistics
  console.log('3. Statistics:');
  const stats = await sentimentService.getSentimentStats();
  console.log('Stats:', {
    total: stats.total_messages,
    positive: `${stats.positive_percentage.toFixed(1)}%`,
    negative: `${stats.negative_percentage.toFixed(1)}%`,
    neutral: `${stats.neutral_percentage.toFixed(1)}%`,
    avgConfidence: `${(stats.average_confidence * 100).toFixed(1)}%`,
    topEmotions: stats.top_emotions.map(e => `${e.emotion}: ${e.percentage.toFixed(1)}%`)
  });
  console.log('');

  // Test configuration
  console.log('4. Configuration:');
  const config = sentimentService.getConfig();
  console.log('Current config:', config);
  
  // Update config example
  sentimentService.updateConfig({
    confidence_threshold: 0.7,
    enable_emotions: true,
    enable_keywords: true
  });
  
  const updatedConfig = sentimentService.getConfig();
  console.log('Updated config:', updatedConfig);
}

export function createSentimentTestReport() {
  return {
    async run() {
      const testResults = await testSentimentAnalysis();
      await demonstrateSentimentFeatures();
      
      return {
        timestamp: new Date().toISOString(),
        testResults,
        summary: {
          accuracy: testResults.accuracy,
          totalTests: testResults.total,
          passedTests: testResults.correct,
          failedTests: testResults.total - testResults.correct
        },
        recommendations: [
          testResults.accuracy >= 80 ? 
            '✅ Sentiment analysis is performing well' : 
            '⚠️ Consider improving sentiment analysis accuracy',
          'Test with more diverse messages for better evaluation',
          'Consider using external APIs for improved accuracy',
          'Monitor sentiment analysis performance in production'
        ]
      };
    }
  };
}

// Usage examples for testing in browser console
export const sentimentExamples = {
  // Basic usage
  async testBasic() {
    const result = await sentimentService.analyzeSentiment('Saya sangat senang dengan layanan ini!');
    console.log('Basic test result:', result);
    return result;
  },

  // Test different languages
  async testLanguages() {
    const messages = [
      'Saya sangat puas dengan produk ini',
      'I am very happy with this product',
      'Este producto es excelente'
    ];

    for (const message of messages) {
      const result = await sentimentService.analyzeSentiment(message);
      console.log(`"${message}" -> ${result.sentiment} (${Math.round(result.confidence * 100)}%)`);
    }
  },

  // Test edge cases
  async testEdgeCases() {
    const edgeCases = [
      '', // Empty message
      '???', // Only symbols
      'Baik buruk baik buruk', // Mixed sentiment
      'BAGUS SEKALI!!!', // All caps
      'halo', // Very short
      'Lorem ipsum dolor sit amet consectetur adipiscing elit'.repeat(10) // Very long
    ];

    for (const message of edgeCases) {
      try {
        const result = await sentimentService.analyzeSentiment(message);
        console.log(`Edge case "${message.substring(0, 30)}..." -> ${result.sentiment}`);
      } catch (error) {
        console.log(`Edge case error for "${message.substring(0, 30)}...":`, error);
      }
    }
  }
}; 