-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    theme TEXT DEFAULT 'light',
    font_size TEXT DEFAULT 'medium',
    translation_model TEXT DEFAULT 'deepseek/deepseek-chat',
    auto_translate BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Translations table
CREATE TABLE IF NOT EXISTS translations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sefaria_ref TEXT NOT NULL,
    hebrew_text TEXT NOT NULL,
    english_translation TEXT NOT NULL,
    model_used TEXT NOT NULL,
    request_cost DECIMAL(10, 6),
    cached_from UUID REFERENCES translations(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sefaria_ref)
);

-- User Metrics table
CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sefaria_ref TEXT NOT NULL,
    total_visits INTEGER DEFAULT 1,
    total_time_seconds INTEGER DEFAULT 0,
    notes TEXT,
    last_visited TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sefaria_ref)
);

-- User Journeys table
CREATE TABLE IF NOT EXISTS user_journeys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID,
    sefaria_ref TEXT NOT NULL,
    parent_ref TEXT,
    nav_state JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_translations_ref ON translations(sefaria_ref);
CREATE INDEX idx_translations_created ON translations(created_at DESC);
CREATE INDEX idx_journeys_user_session ON user_journeys(user_id, session_id);
CREATE INDEX idx_journeys_ref ON user_journeys(sefaria_ref);
CREATE INDEX idx_journeys_visited ON user_journeys(visited_at DESC);
CREATE INDEX idx_metrics_user_ref ON user_metrics(user_id, sefaria_ref);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User Preferences policies
CREATE POLICY "Users can view own preferences" 
    ON user_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
    ON user_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
    ON user_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

-- Translations policies
CREATE POLICY "Anyone can view translations" 
    ON translations FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert translations" 
    ON translations FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- User Metrics policies
CREATE POLICY "Users can view own metrics" 
    ON user_metrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" 
    ON user_metrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" 
    ON user_metrics FOR UPDATE 
    USING (auth.uid() = user_id);

-- User Journeys policies
CREATE POLICY "Users can view own journeys" 
    ON user_journeys FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journeys" 
    ON user_journeys FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- User Sessions policies
CREATE POLICY "Users can view own sessions" 
    ON user_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
    ON user_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
    ON user_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
    ON user_sessions FOR DELETE 
    USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION increment_view_count(
    p_user_id UUID,
    p_sefaria_ref TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO user_metrics (user_id, sefaria_ref, total_visits, last_visited)
    VALUES (p_user_id, p_sefaria_ref, 1, NOW())
    ON CONFLICT (user_id, sefaria_ref)
    DO UPDATE SET 
        total_visits = user_metrics.total_visits + 1,
        last_visited = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_time_spent(
    p_user_id UUID,
    p_sefaria_ref TEXT,
    p_seconds INTEGER
) RETURNS void AS $$
BEGIN
    UPDATE user_metrics 
    SET total_time_seconds = total_time_seconds + p_seconds
    WHERE user_id = p_user_id AND sefaria_ref = p_sefaria_ref;
END;
$$ LANGUAGE plpgsql;