import { NextResponse } from 'next/server';
import { completeShopifyOrder } from '../../../../lib/orderCompletion';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  
  try {
    const body = await req.json();
    const { 
      merchant_key, 
      draft_order_id, 
      shipping_address, 
      email, 
      phone, 
      device_id, 
      payment_method, 
      cashfree_order_id, 
      wallet_credit_amount 
    } = body;

    if (!merchant_key || !draft_order_id || !shipping_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const result = await completeShopifyOrder({
      merchant_key,
      draft_order_id,
      shipping_address,
      email,
      phone,
      device_id,
      payment_method: payment_method || 'prepaid',
      cashfree_order_id,
      wallet_credit_amount,
      skip_cf_verification: false
    });

    return NextResponse.json({ 
      success: true, 
      order_id: result.order_id,
      already_completed: result.already_completed,
      message: 'Order confirmed successfully!'
    }, { headers });

  } catch (error: any) {
    console.error('[Complete API] Error completing order:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to complete order' 
    }, { status: 400, headers });
  }
}
