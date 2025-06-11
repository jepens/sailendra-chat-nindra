-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sentiment enum type
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral');

-- Create emotion enum type  
CREATE TYPE emotion_type AS ENUM ('joy', 'anger', 'fear', 'sadness', 'surprise', 'disgust', 'trust', 'anticipation');

-- Create analysis provider enum
CREATE TYPE analysis_provider AS ENUM ('openai', 'local', 'hybrid');

-- Table for storing individual message sentiment analysis
CREATE TABLE sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id INTEGER NOT NULL, -- References n8n_chat_histories.id
    session_id VARCHAR NOT NULL,
    message_content TEXT NOT NULL,
    sentiment sentiment_type NOT NULL,
    confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    emotions JSONB, -- Store emotion scores as JSON
    keywords TEXT[], -- Array of sentiment keywords found
    analysis_provider analysis_provider DEFAULT 'hybrid',
    openai_raw_response JSONB, -- Store full OpenAI response for debugging
    processing_time_ms INTEGER, -- Track processing performance
    tokens_used INTEGER, -- Track OpenAI token usage for cost monitoring
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for session-level sentiment summary
CREATE TABLE session_sentiment_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR UNIQUE NOT NULL,
    total_human_messages INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    positive_percentage DECIMAL(5,2) DEFAULT 0,
    negative_percentage DECIMAL(5,2) DEFAULT 0,
    neutral_percentage DECIMAL(5,2) DEFAULT 0,
    avg_confidence DECIMAL(4,3) DEFAULT 0,
    dominant_sentiment sentiment_type,
    dominant_emotions JSONB, -- Top emotions for this session
    satisfaction_score DECIMAL(4,3), -- Calculated customer satisfaction (0-1)
    conversation_quality VARCHAR(20), -- excellent, good, fair, poor
    first_message_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    total_tokens_used INTEGER DEFAULT 0, -- Track cumulative OpenAI usage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking batch processing jobs
CREATE TABLE sentiment_batch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    total_messages INTEGER DEFAULT 0,
    processed_messages INTEGER DEFAULT 0,
    failed_messages INTEGER DEFAULT 0,
    session_filter VARCHAR, -- Optional session filter
    date_from TIMESTAMP WITH TIME ZONE,
    date_to TIMESTAMP WITH TIME ZONE,
    processing_options JSONB, -- Store job configuration
    error_log JSONB, -- Store errors encountered
    total_tokens_used INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
    actual_cost_usd DECIMAL(10,4) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sentiment_analysis_message_id ON sentiment_analysis(message_id);
CREATE INDEX idx_sentiment_analysis_session_id ON sentiment_analysis(session_id);
CREATE INDEX idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment);
CREATE INDEX idx_sentiment_analysis_created_at ON sentiment_analysis(created_at);
CREATE INDEX idx_session_sentiment_summary_session_id ON session_sentiment_summary(session_id);
CREATE INDEX idx_session_sentiment_summary_satisfaction ON session_sentiment_summary(satisfaction_score);
CREATE INDEX idx_batch_jobs_status ON sentiment_batch_jobs(status);

-- Create function to update session summary when sentiment analysis is added
CREATE OR REPLACE FUNCTION update_session_sentiment_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update session summary
    INSERT INTO session_sentiment_summary (
        session_id,
        total_human_messages,
        positive_count,
        negative_count,
        neutral_count,
        positive_percentage,
        negative_percentage,
        neutral_percentage,
        avg_confidence,
        dominant_sentiment,
        satisfaction_score,
        last_analyzed_at,
        total_tokens_used
    )
    SELECT 
        NEW.session_id,
        COUNT(*) as total_human_messages,
        COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
        COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
        ROUND((COUNT(*) FILTER (WHERE sentiment = 'positive')::DECIMAL / COUNT(*)) * 100, 2) as positive_percentage,
        ROUND((COUNT(*) FILTER (WHERE sentiment = 'negative')::DECIMAL / COUNT(*)) * 100, 2) as negative_percentage,
        ROUND((COUNT(*) FILTER (WHERE sentiment = 'neutral')::DECIMAL / COUNT(*)) * 100, 2) as neutral_percentage,
        ROUND(AVG(confidence_score), 3) as avg_confidence,
        (
            SELECT sentiment 
            FROM sentiment_analysis sa2 
            WHERE sa2.session_id = NEW.session_id 
            GROUP BY sentiment 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as dominant_sentiment,
        CASE 
            WHEN COUNT(*) FILTER (WHERE sentiment = 'positive') > COUNT(*) FILTER (WHERE sentiment = 'negative') 
            THEN ROUND(AVG(CASE WHEN sentiment = 'positive' THEN confidence_score ELSE 1 - confidence_score END), 3)
            ELSE ROUND(1 - AVG(CASE WHEN sentiment = 'negative' THEN confidence_score ELSE 1 - confidence_score END), 3)
        END as satisfaction_score,
        NOW() as last_analyzed_at,
        COALESCE(SUM(tokens_used), 0) as total_tokens_used
    FROM sentiment_analysis sa
    WHERE sa.session_id = NEW.session_id
    ON CONFLICT (session_id) 
    DO UPDATE SET
        total_human_messages = EXCLUDED.total_human_messages,
        positive_count = EXCLUDED.positive_count,
        negative_count = EXCLUDED.negative_count,
        neutral_count = EXCLUDED.neutral_count,
        positive_percentage = EXCLUDED.positive_percentage,
        negative_percentage = EXCLUDED.negative_percentage,
        neutral_percentage = EXCLUDED.neutral_percentage,
        avg_confidence = EXCLUDED.avg_confidence,
        dominant_sentiment = EXCLUDED.dominant_sentiment,
        satisfaction_score = EXCLUDED.satisfaction_score,
        last_analyzed_at = EXCLUDED.last_analyzed_at,
        total_tokens_used = EXCLUDED.total_tokens_used,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session summary
CREATE TRIGGER trigger_update_session_sentiment_summary
    AFTER INSERT OR UPDATE ON sentiment_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_session_sentiment_summary();

-- Create function to calculate conversation quality
CREATE OR REPLACE FUNCTION calculate_conversation_quality(satisfaction DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    CASE 
        WHEN satisfaction >= 0.8 THEN RETURN 'excellent';
        WHEN satisfaction >= 0.6 THEN RETURN 'good';
        WHEN satisfaction >= 0.4 THEN RETURN 'fair';
        ELSE RETURN 'poor';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update conversation quality in session summary
UPDATE session_sentiment_summary 
SET conversation_quality = calculate_conversation_quality(satisfaction_score)
WHERE satisfaction_score IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE sentiment_analysis IS 'Stores sentiment analysis results for individual chat messages';
COMMENT ON TABLE session_sentiment_summary IS 'Aggregated sentiment data per chat session for quick analytics';
COMMENT ON TABLE sentiment_batch_jobs IS 'Tracks batch processing jobs for historical data analysis';
COMMENT ON COLUMN sentiment_analysis.tokens_used IS 'OpenAI tokens used for cost tracking';
COMMENT ON COLUMN session_sentiment_summary.satisfaction_score IS 'Calculated customer satisfaction score (0-1)';
COMMENT ON COLUMN session_sentiment_summary.conversation_quality IS 'Qualitative assessment: excellent, good, fair, poor'; 