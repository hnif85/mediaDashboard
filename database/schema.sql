-- Supabase Schema untuk Telegram Channel Analyzer

-- Table untuk menyimpan hasil analisis channel
CREATE TABLE channel_analyses (
    id BIGSERIAL PRIMARY KEY,
    channel_name VARCHAR(255) NOT NULL,
    channel_link TEXT NOT NULL,
    channel_info JSONB NOT NULL,
    messages JSONB NOT NULL,
    analysis_result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk performa query
CREATE INDEX idx_channel_analyses_channel_name ON channel_analyses(channel_name);
CREATE INDEX idx_channel_analyses_created_at ON channel_analyses(created_at DESC);
CREATE INDEX idx_channel_analyses_rating ON channel_analyses USING GIN ((analysis_result->'verdict'->>'rating'));
CREATE INDEX idx_channel_analyses_trust_score ON channel_analyses USING GIN ((analysis_result->'verdict'->>'trustScore'));

-- Table untuk menyimpan log aktivitas
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    channel_name VARCHAR(255),
    user_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk activity logs
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_channel_analyses_updated_at 
    BEFORE UPDATE ON channel_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies jika diperlukan
ALTER TABLE channel_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk read access (semua user bisa read)
CREATE POLICY "Allow read access for all users" ON channel_analyses
    FOR SELECT USING (true);

-- Policy untuk insert access (semua user bisa insert)
CREATE POLICY "Allow insert access for all users" ON channel_analyses
    FOR INSERT WITH CHECK (true);

-- Policy untuk activity logs
CREATE POLICY "Allow read access for activity logs" ON activity_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access for activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Views untuk reporting
CREATE VIEW channel_analysis_summary AS
SELECT 
    id,
    channel_name,
    channel_link,
    (channel_info->>'title') as channel_title,
    (channel_info->>'subscribers')::integer as subscribers,
    (analysis_result->'verdict'->>'trustScore')::integer as trust_score,
    (analysis_result->'verdict'->>'rating') as rating,
    (analysis_result->'profileCheck'->>'bioConsistency') as bio_consistency,
    (analysis_result->'contentCheck'->>'relevance') as content_relevance,
    (analysis_result->'contentCheck'->'engagementMetrics'->>'engagementRatio') as engagement_ratio,
    created_at
FROM channel_analyses
ORDER BY created_at DESC;

-- View untuk statistik dashboard
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE analysis_result->'verdict'->>'rating' = 'Legit') as legit_count,
    COUNT(*) FILTER (WHERE analysis_result->'verdict'->>'rating' = 'Doubtful') as doubtful_count,
    COUNT(*) FILTER (WHERE analysis_result->'verdict'->>'rating' = 'Scam Risk') as scam_risk_count,
    ROUND(AVG((analysis_result->'verdict'->>'trustScore')::integer)) as avg_trust_score,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month_count
FROM channel_analyses;