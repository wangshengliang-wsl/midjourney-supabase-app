import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Cancel order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params

    if (!orderNo) {
      return NextResponse.json({ error: '订单号不能为空' }, { status: 400 })
    }

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // Use admin client
    const adminClient = createAdminClient()

    // Check if order exists and belongs to user
    const { data: orderData, error: orderError } = await adminClient
      .from('ai_images_creator_payments')
      .select('*')
      .eq('out_trade_no', orderNo)
      .eq('user_id', user.id)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // Only pending orders can be cancelled
    if (orderData.status !== 'pending') {
      return NextResponse.json({ error: '只能取消待支付订单' }, { status: 400 })
    }

    // Update order status to cancelled
    const { error: updateError } = await adminClient
      .from('ai_images_creator_payments')
      .update({ status: 'cancelled' })
      .eq('out_trade_no', orderNo)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Cancel order error:', updateError)
      return NextResponse.json({ error: '取消订单失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: '取消订单失败' }, { status: 500 })
  }
}

// Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params

    if (!orderNo) {
      return NextResponse.json({ error: '订单号不能为空' }, { status: 400 })
    }

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // Use admin client
    const adminClient = createAdminClient()

    // Delete order
    const { error: deleteError } = await adminClient
      .from('ai_images_creator_payments')
      .delete()
      .eq('out_trade_no', orderNo)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete order error:', deleteError)
      return NextResponse.json({ error: '删除订单失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: '删除订单失败' }, { status: 500 })
  }
}

