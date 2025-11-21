import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySign } from '@/lib/payment/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract all parameters
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const key = process.env.ZPAY_KEY
    if (!key) {
      console.error('Payment key not configured')
      return new NextResponse('error', { status: 500 })
    }

    // Step 1: Verify signature
    const isValid = verifySign(params, key)
    if (!isValid) {
      console.error('Invalid signature:', params)
      return new NextResponse('sign error', { status: 400 })
    }

    // Step 2: Extract parameters
    const {
      out_trade_no,
      trade_no,
      money,
      trade_status,
      pid,
    } = params

    // Validate required fields
    if (!out_trade_no || !trade_no || !money || !trade_status) {
      console.error('Missing required parameters')
      return new NextResponse('param error', { status: 400 })
    }

    // Step 3: Check if payment is successful
    if (trade_status !== 'TRADE_SUCCESS') {
      console.log('Payment not successful:', trade_status)
      return new NextResponse('success', { status: 200 }) // Return success to stop retry
    }

    // Use admin client for database operations
    const adminClient = createAdminClient()

    // Step 4: Get order info
    const { data: orderData, error: orderError } = await adminClient
      .from('ai_images_creator_payments')
      .select('*')
      .eq('out_trade_no', out_trade_no)
      .single()

    if (orderError || !orderData) {
      console.error('Order not found:', out_trade_no)
      return new NextResponse('order not found', { status: 404 })
    }

    // Step 5: Verify amount
    const orderAmount = parseFloat(orderData.amount)
    const paidAmount = parseFloat(money)
    
    if (Math.abs(orderAmount - paidAmount) > 0.01) {
      console.error('Amount mismatch:', { orderAmount, paidAmount })
      
      // Update order status to failed
      await adminClient
        .from('ai_images_creator_payments')
        .update({
          status: 'failed',
          notify_data: params,
        })
        .eq('out_trade_no', out_trade_no)
      
      return new NextResponse('amount error', { status: 400 })
    }

    // Step 6: Check if already processed
    if (orderData.status === 'success') {
      console.log('Order already processed:', out_trade_no)
      return new NextResponse('success', { status: 200 })
    }

    // Step 7: Process payment (add credits and update order)
    const { data: processData, error: processError } = await adminClient
      .rpc('process_successful_payment', {
        p_out_trade_no: out_trade_no,
        p_trade_no: trade_no,
        p_notify_data: params,
      })

    if (processError) {
      console.error('Process payment error:', processError)
      return new NextResponse('process error', { status: 500 })
    }

    console.log('Payment processed successfully:', out_trade_no)
    return new NextResponse('success', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('error', { status: 500 })
  }
}

// Support POST method as well
export async function POST(request: NextRequest) {
  return GET(request)
}

