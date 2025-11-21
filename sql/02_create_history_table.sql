-- =====================================================
-- Table: ai_images_creator_history
-- Description: Store user's AI image generation history
-- =====================================================

-- Create the history table
CREATE TABLE IF NOT EXISTS public.ai_images_creator_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    task_id TEXT,
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.ai_images_creator_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.ai_images_creator_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_created ON public.ai_images_creator_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_status ON public.ai_images_creator_history(status);
CREATE INDEX IF NOT EXISTS idx_history_task_id ON public.ai_images_creator_history(task_id) WHERE task_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.ai_images_creator_history IS 'Stores user AI image generation history';
COMMENT ON COLUMN public.ai_images_creator_history.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.ai_images_creator_history.prompt IS 'User input prompt for image generation';
COMMENT ON COLUMN public.ai_images_creator_history.task_id IS 'External API task ID for tracking';
COMMENT ON COLUMN public.ai_images_creator_history.image_urls IS 'Array of generated image URLs (typically 4)';
COMMENT ON COLUMN public.ai_images_creator_history.status IS 'Generation status: pending, generating, completed, failed';
COMMENT ON COLUMN public.ai_images_creator_history.error_message IS 'Error message if generation failed';
COMMENT ON COLUMN public.ai_images_creator_history.metadata IS 'Additional metadata (e.g., model, parameters)';

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================
CREATE TRIGGER update_history_updated_at
    BEFORE UPDATE ON public.ai_images_creator_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.ai_images_creator_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own history"
    ON public.ai_images_creator_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own history"
    ON public.ai_images_creator_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own history (for status updates)
CREATE POLICY "Users can update own history"
    ON public.ai_images_creator_history
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own history"
    ON public.ai_images_creator_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Helper function: Create generation record
-- =====================================================
CREATE OR REPLACE FUNCTION create_generation_record(
    p_prompt TEXT,
    p_task_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO public.ai_images_creator_history (
        user_id,
        prompt,
        task_id,
        status,
        metadata
    )
    VALUES (
        auth.uid(),
        p_prompt,
        p_task_id,
        'pending',
        p_metadata
    )
    RETURNING id INTO v_record_id;
    
    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Update generation record
-- =====================================================
CREATE OR REPLACE FUNCTION update_generation_record(
    p_record_id UUID,
    p_status TEXT,
    p_image_urls JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.ai_images_creator_history
    SET 
        status = p_status,
        image_urls = COALESCE(p_image_urls, image_urls),
        error_message = p_error_message,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_record_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Generation record not found or access denied';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get user generation statistics
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_generation_stats()
RETURNS TABLE (
    total_generations BIGINT,
    successful_generations BIGINT,
    failed_generations BIGINT,
    total_images BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_generations,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_generations,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_generations,
        COALESCE(SUM(jsonb_array_length(image_urls)) FILTER (WHERE status = 'completed'), 0)::BIGINT as total_images
    FROM public.ai_images_creator_history
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- View: Recent generation history with image count
-- =====================================================
CREATE OR REPLACE VIEW user_generation_history AS
SELECT 
    h.id,
    h.prompt,
    h.status,
    h.error_message,
    jsonb_array_length(h.image_urls) as image_count,
    h.image_urls,
    h.created_at,
    h.updated_at
FROM public.ai_images_creator_history h
WHERE h.user_id = auth.uid()
ORDER BY h.created_at DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_images_creator_history TO authenticated;
GRANT EXECUTE ON FUNCTION create_generation_record(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_generation_record(UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_generation_stats() TO authenticated;
GRANT SELECT ON user_generation_history TO authenticated;

