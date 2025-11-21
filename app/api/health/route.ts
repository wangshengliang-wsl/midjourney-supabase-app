import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Check if tables exist
    const checks = {
      credits_table: false,
      history_table: false,
      payments_table: false,
      env_variables: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        qwen_api_key: !!process.env.QWEN_API_KEY,
        zpay_pid: !!process.env.ZPAY_PID,
        zpay_key: !!process.env.ZPAY_KEY,
      },
      errors: [] as string[],
    }

    // Check credits table
    const { error: creditsError } = await adminClient
      .from('ai_images_creator_credits')
      .select('count')
      .limit(1)

    if (creditsError) {
      checks.errors.push(`Credits table: ${creditsError.message}`)
    } else {
      checks.credits_table = true
    }

    // Check history table
    const { error: historyError } = await adminClient
      .from('ai_images_creator_history')
      .select('count')
      .limit(1)

    if (historyError) {
      checks.errors.push(`History table: ${historyError.message}`)
    } else {
      checks.history_table = true
    }

    // Check payments table
    const { error: paymentsError } = await adminClient
      .from('ai_images_creator_payments')
      .select('count')
      .limit(1)

    if (paymentsError) {
      checks.errors.push(`Payments table: ${paymentsError.message}`)
    } else {
      checks.payments_table = true
    }

    return NextResponse.json(checks)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Health check failed',
        env_variables: {
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          qwen_api_key: !!process.env.QWEN_API_KEY,
          zpay_pid: !!process.env.ZPAY_PID,
          zpay_key: !!process.env.ZPAY_KEY,
        },
      },
      { status: 500 }
    )
  }
}

