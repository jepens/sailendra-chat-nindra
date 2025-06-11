import { supabase } from '@/integrations/supabase/client';
import { hybridSentimentService } from './hybridSentimentService';
import { logger } from '@/utils/logger';

interface BatchProcessingOptions {
  sessionId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  onProgress?: (processed: number, total: number, cost: number) => void;
}

interface BatchResult {
  jobId: string;
  totalMessages: number;
  processed: number;
  failed: number;
  totalCost: number;
  totalTokens: number;
  duration: number;
}

export class BatchSentimentProcessor {
  private isProcessing = false;
  private currentJobId: string | null = null;

  async processHistoricalData(options: BatchProcessingOptions = {}): Promise<BatchResult> {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const jobId = crypto.randomUUID();
    this.currentJobId = jobId;

    try {
      // Create batch job record
      const { error: jobError } = await supabase
        .from('sentiment_batch_jobs')
        .insert([{
          id: jobId,
          job_name: `historical_analysis_${new Date().toISOString().split('T')[0]}`,
          status: 'running',
          session_filter: options.sessionId,
          date_from: options.dateFrom,
          date_to: options.dateTo,
          processing_options: options,
          started_at: new Date().toISOString()
        }]);

      if (jobError) {
        throw jobError;
      }

      // Get unprocessed human messages
      let query = supabase
        .from('n8n_chat_histories')
        .select('id, session_id, message, created_at')
        .eq('message->>type', 'human'); // Only process human messages

      // Apply filters
      if (options.sessionId) {
        query = query.eq('session_id', options.sessionId);
      }
      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }
      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: messages, error: msgError } = await query
        .order('created_at', { ascending: true });

      if (msgError) {
        throw msgError;
      }

      // Filter out already processed messages
      const processedMessageIds = await this.getProcessedMessageIds();
      const unprocessedMessages = messages?.filter(msg => 
        !processedMessageIds.includes(msg.id)
      ) || [];

      const totalMessages = unprocessedMessages.length;
      let processed = 0;
      let failed = 0;
      let totalTokens = 0;
      let totalCost = 0;

      // Update job with total count
      await supabase
        .from('sentiment_batch_jobs')
        .update({ total_messages: totalMessages })
        .eq('id', jobId);

      logger.info(`Starting batch processing for ${totalMessages} unprocessed messages`);

      // Process messages with rate limiting
      for (const message of unprocessedMessages) {
        try {
          const messageContent = typeof message.message === 'string' 
            ? JSON.parse(message.message) 
            : message.message;

          const content = messageContent.content || messageContent.text || '';
          
          if (content.trim().length === 0) {
            logger.warn(`Skipping empty message ${message.id}`);
            continue;
          }

          // Analyze sentiment using hybrid service
          const result = await hybridSentimentService.analyzeMessage(
            message.id.toString(),
            message.session_id,
            content
          );

          processed++;

          // Track costs (mock values for now)
          const estimatedTokens = Math.ceil(content.length / 3); // Rough estimation
          const estimatedCost = estimatedTokens * 0.00001; // Rough cost estimation
          
          totalTokens += estimatedTokens;
          totalCost += estimatedCost;

          // Report progress
          if (options.onProgress) {
            options.onProgress(processed, totalMessages, totalCost);
          }

          // Update job progress every 10 messages
          if (processed % 10 === 0) {
            await supabase
              .from('sentiment_batch_jobs')
              .update({ 
                processed_messages: processed,
                total_tokens_used: totalTokens,
                estimated_cost_usd: totalCost
              })
              .eq('id', jobId);
          }

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          failed++;
          logger.error(`Failed to process message ${message.id}:`, error);
          
          // Don't fail the entire batch for individual message errors
          continue;
        }
      }

      const duration = Date.now() - startTime;

      // Complete the job
      await supabase
        .from('sentiment_batch_jobs')
        .update({
          status: 'completed',
          processed_messages: processed,
          failed_messages: failed,
          total_tokens_used: totalTokens,
          actual_cost_usd: totalCost,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      const result: BatchResult = {
        jobId,
        totalMessages,
        processed,
        failed,
        totalCost,
        totalTokens,
        duration
      };

      logger.info('Batch processing completed:', result);
      return result;

    } catch (error) {
      // Mark job as failed
      await supabase
        .from('sentiment_batch_jobs')
        .update({
          status: 'failed',
          error_log: { error: error instanceof Error ? error.message : 'Unknown error' },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      logger.error('Batch processing failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentJobId = null;
    }
  }

  private async getProcessedMessageIds(): Promise<number[]> {
    try {
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('message_id');

      if (error) {
        logger.warn('Failed to get processed message IDs:', error);
        return [];
      }

      return data.map(row => row.message_id);
    } catch (error) {
      logger.warn('Error getting processed message IDs:', error);
      return [];
    }
  }

  async getJobStatus(jobId: string) {
    const { data, error } = await supabase
      .from('sentiment_batch_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async listJobs(limit: number = 10) {
    const { data, error } = await supabase
      .from('sentiment_batch_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  getCurrentJobId(): string | null {
    return this.currentJobId;
  }

  async cancelCurrentJob(): Promise<boolean> {
    if (!this.isProcessing || !this.currentJobId) {
      return false;
    }

    try {
      await supabase
        .from('sentiment_batch_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', this.currentJobId);

      this.isProcessing = false;
      this.currentJobId = null;
      return true;
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      return false;
    }
  }
}

// Export singleton instance
export const batchProcessor = new BatchSentimentProcessor(); 