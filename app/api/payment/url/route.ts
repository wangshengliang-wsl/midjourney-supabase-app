import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSign, generateOrderNumber } from '@/lib/payment/utils'

export async function POST(request: NextRequest) {
  try {
    const { amount, credits, paymentType } = await request.json()

    // Validate input
    if (!amount || !credits || !paymentType) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    if (!['alipay', 'wxpay'].includes(paymentType)) {
      return NextResponse.json({ error: '不支持的支付方式' }, { status: 400 })
    }

    // Get environment variables
    const pid = process.env.ZPAY_PID
    const key = process.env.ZPAY_KEY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!pid || !key) {
      return NextResponse.json({ error: '支付配置未完成' }, { status: 500 })
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

    // Generate order number
    const outTradeNo = generateOrderNumber()

    // Create payment record in database
    const adminClient = createAdminClient()
    const { error: insertError } = await adminClient
      .from('ai_images_creator_payments')
      .insert({
        user_id: user.id,
        out_trade_no: outTradeNo,
        amount: amount,
        credits: credits,
        payment_type: paymentType,
        product_name: `AI绘图点数充值 ${credits}点`,
        status: 'pending',
      })

    if (insertError) {
      console.error('Create payment order error:', insertError)
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
    }

    // Build payment parameters
    const params = {
      name: `AI绘图点数充值 ${credits}点`,
      money: amount.toFixed(2),
      type: paymentType,
      out_trade_no: outTradeNo,
      notify_url: `${baseUrl}/api/payment/webhook`,
      pid: pid,
      return_url: `${baseUrl}/protected?order=${outTradeNo}`,
      sign_type: 'MD5',
    }

    // Generate signature
    const sign = generateSign(params, key)

    // Build payment URL
    const paymentUrl = new URL('https://zpayz.cn/submit.php')
    Object.entries({ ...params, sign }).forEach(([key, value]) => {
      paymentUrl.searchParams.append(key, String(value))
    })

    return NextResponse.json({
      paymentUrl: paymentUrl.toString(),
      outTradeNo: outTradeNo,
    })
  } catch (error) {
    console.error('Generate payment URL error:', error)
    return NextResponse.json(
      { error: '生成支付链接失败' },
      { status: 500 }
    )
  }
}

