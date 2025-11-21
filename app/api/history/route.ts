import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Get current user using regular client
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: '认证失败' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use admin client for database operations
    const adminClient = createAdminClient()

    // Get user history
    const { data: historyData, error: historyError } = await adminClient
      .from('ai_images_creator_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error('Get history error:', historyError)
      return NextResponse.json(
        { error: `获取历史记录失败: ${historyError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ history: historyData || [] })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取历史记录失败' },
      { status: 500 }
    )
  }
}

