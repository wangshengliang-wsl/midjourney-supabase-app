import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Use admin client for database operations
    const adminClient = createAdminClient()

    // Get payment history
    const { data: paymentsData, error: paymentsError } = await adminClient
      .from('ai_images_creator_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (paymentsError) {
      console.error('Get payment history error:', paymentsError)
      return NextResponse.json(
        { error: `获取充值历史失败: ${paymentsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ payments: paymentsData || [] })
  } catch (error) {
    console.error('Get payment history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取充值历史失败' },
      { status: 500 }
    )
  }
}

