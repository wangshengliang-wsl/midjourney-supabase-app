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

    // Use admin client for database operations
    const adminClient = createAdminClient()

    // Get user credits
    const { data: creditsData, error: creditsError } = await adminClient
      .from('ai_images_creator_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      // If record doesn't exist (PGRST116), create one
      if (creditsError.code === 'PGRST116') {
        console.log('Credits record not found, creating new one for user:', user.id)
        
        const { data: newCredits, error: createError } = await adminClient
          .from('ai_images_creator_credits')
          .insert({ user_id: user.id, credits: 5 })
          .select('credits')
          .single()

        if (createError) {
          console.error('Create credits error:', createError)
          return NextResponse.json(
            { error: `创建点数记录失败: ${createError.message}` },
            { status: 500 }
          )
        }

        return NextResponse.json({ credits: newCredits.credits })
      }

      // Other errors
      console.error('Get credits error:', creditsError)
      return NextResponse.json(
        { error: `获取点数失败: ${creditsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ credits: creditsData?.credits || 0 })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取点数失败' },
      { status: 500 }
    )
  }
}

