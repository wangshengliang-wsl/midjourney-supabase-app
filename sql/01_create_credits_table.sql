-- =====================================================
-- Table: ai_images_creator_credits
-- Description: Store user credits for AI image generation
-- =====================================================

-- Create the credits table
CREATE TABLE IF NOT EXISTS public.ai_images_creator_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL DEFAULT 5 CHECK (credits >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.ai_images_creator_credits(user_id);

-- Add comment to table
COMMENT ON TABLE public.ai_images_creator_credits IS 'Stores user credits for AI image generation';
COMMENT ON COLUMN public.ai_images_creator_credits.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.ai_images_creator_credits.credits IS 'Number of credits available (must be >= 0)';

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credits_updated_at
    BEFORE UPDATE ON public.ai_images_creator_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Trigger: Auto-create credits record on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.ai_images_creator_credits (user_id, credits)
    VALUES (NEW.id, 5)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_credits();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.ai_images_creator_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own credits
CREATE POLICY "Users can view own credits"
    ON public.ai_images_creator_credits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own credits (for consuming credits)
CREATE POLICY "Users can update own credits"
    ON public.ai_images_creator_credits
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert credits (for initial setup or admin)
CREATE POLICY "Service role can insert credits"
    ON public.ai_images_creator_credits
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- Helper function: Consume credits
-- =====================================================
CREATE OR REPLACE FUNCTION consume_credits(amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits
    FROM public.ai_images_creator_credits
    WHERE user_id = auth.uid()
    FOR UPDATE;

    -- Check if user has enough credits
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User credits record not found';
    END IF;

    IF current_credits < amount THEN
        RETURN FALSE;
    END IF;

    -- Deduct credits
    UPDATE public.ai_images_creator_credits
    SET credits = credits - amount
    WHERE user_id = auth.uid();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Add credits (for recharge)
-- =====================================================
CREATE OR REPLACE FUNCTION add_credits(amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.ai_images_creator_credits
    SET credits = credits + amount
    WHERE user_id = auth.uid();
    
    IF NOT FOUND THEN
        INSERT INTO public.ai_images_creator_credits (user_id, credits)
        VALUES (auth.uid(), amount);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.ai_images_creator_credits TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credits(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(INTEGER) TO authenticated;

