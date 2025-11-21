import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    // Query order status
    const { data: orderData, error: orderError } = await supabase
      .from('ai_images_creator_payments')
      .select('status, credits, amount, payment_type')
      .eq('out_trade_no', orderNo)
      .eq('user_id', user.id)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({
      status: orderData.status,
      credits: orderData.credits,
      amount: orderData.amount,
      paymentType: orderData.payment_type,
    })
  } catch (error) {
    console.error('Check order error:', error)
    return NextResponse.json(
      { error: '查询订单状态失败' },
      { status: 500 }
    )
  }
}

