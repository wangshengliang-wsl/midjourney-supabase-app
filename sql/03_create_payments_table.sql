-- =====================================================
-- Table: ai_images_creator_payments
-- Description: Store payment orders for credits recharge
-- =====================================================

-- Create the payments table
CREATE TABLE IF NOT EXISTS public.ai_images_creator_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    out_trade_no TEXT NOT NULL UNIQUE,
    trade_no TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    credits INTEGER NOT NULL CHECK (credits > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('alipay', 'wxpay')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'timeout', 'cancelled')),
    product_name TEXT NOT NULL,
    notify_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.ai_images_creator_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_out_trade_no ON public.ai_images_creator_payments(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payments_trade_no ON public.ai_images_creator_payments(trade_no) WHERE trade_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.ai_images_creator_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.ai_images_creator_payments(created_at DESC);

-- Add comments
COMMENT ON TABLE public.ai_images_creator_payments IS 'Stores payment orders for credits recharge';
COMMENT ON COLUMN public.ai_images_creator_payments.out_trade_no IS 'Merchant order number (unique)';
COMMENT ON COLUMN public.ai_images_creator_payments.trade_no IS 'Payment platform order number';
COMMENT ON COLUMN public.ai_images_creator_payments.amount IS 'Payment amount in yuan';
COMMENT ON COLUMN public.ai_images_creator_payments.credits IS 'Credits to be added after payment';
COMMENT ON COLUMN public.ai_images_creator_payments.payment_type IS 'Payment method: alipay or wxpay';
COMMENT ON COLUMN public.ai_images_creator_payments.status IS 'Payment status: pending, success, failed, timeout, cancelled';
COMMENT ON COLUMN public.ai_images_creator_payments.notify_data IS 'Raw notification data from payment platform';

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.ai_images_creator_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.ai_images_creator_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment records
CREATE POLICY "Users can view own payments"
    ON public.ai_images_creator_payments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own payment records
CREATE POLICY "Users can insert own payments"
    ON public.ai_images_creator_payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can update payment records (for webhook)
CREATE POLICY "Service role can update payments"
    ON public.ai_images_creator_payments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Helper function: Create payment order
-- =====================================================
CREATE OR REPLACE FUNCTION create_payment_order(
    p_amount DECIMAL,
    p_credits INTEGER,
    p_payment_type TEXT,
    p_product_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_out_trade_no TEXT;
BEGIN
    -- Generate unique order number: YYYYMMDDHHMMSS + random 3 digits
    v_out_trade_no := to_char(now(), 'YYYYMMDDHH24MISS') || lpad(floor(random() * 1000)::text, 3, '0');
    
    INSERT INTO public.ai_images_creator_payments (
        user_id,
        out_trade_no,
        amount,
        credits,
        payment_type,
        product_name,
        status
    )
    VALUES (
        auth.uid(),
        v_out_trade_no,
        p_amount,
        p_credits,
        p_payment_type,
        p_product_name,
        'pending'
    );
    
    RETURN v_out_trade_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Process successful payment
-- =====================================================
CREATE OR REPLACE FUNCTION process_successful_payment(
    p_out_trade_no TEXT,
    p_trade_no TEXT,
    p_notify_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_credits INTEGER;
    v_current_status TEXT;
BEGIN
    -- Get order info with row lock
    SELECT user_id, credits, status 
    INTO v_user_id, v_credits, v_current_status
    FROM public.ai_images_creator_payments
    WHERE out_trade_no = p_out_trade_no
    FOR UPDATE;

    -- Check if order exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Check if already processed
    IF v_current_status = 'success' THEN
        RETURN TRUE; -- Already processed, return success
    END IF;

    -- Update payment record
    UPDATE public.ai_images_creator_payments
    SET 
        status = 'success',
        trade_no = p_trade_no,
        notify_data = p_notify_data,
        paid_at = timezone('utc'::text, now())
    WHERE out_trade_no = p_out_trade_no;

    -- Add credits to user
    UPDATE public.ai_images_creator_credits
    SET credits = credits + v_credits
    WHERE user_id = v_user_id;

    -- If credits record doesn't exist, create one
    IF NOT FOUND THEN
        INSERT INTO public.ai_images_creator_credits (user_id, credits)
        VALUES (v_user_id, v_credits)
        ON CONFLICT (user_id) DO UPDATE
        SET credits = ai_images_creator_credits.credits + v_credits;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.ai_images_creator_payments TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_order(DECIMAL, INTEGER, TEXT, TEXT) TO authenticated;

