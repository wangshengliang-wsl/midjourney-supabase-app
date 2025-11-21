import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  let historyRecordId: string | null = null;
  let creditsDeducted = false;

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: '请输入提示词' }, { status: 400 });
    }

    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // Use admin client for database operations
    const adminClient = createAdminClient();

    // Step 1: Check and consume credits
    const { data: creditsData, error: creditsError } = await adminClient
      .from('ai_images_creator_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      return NextResponse.json({ error: '获取点数失败' }, { status: 500 });
    }

    if (creditsData.credits < 1) {
      return NextResponse.json({ error: '点数不足，请充值' }, { status: 400 });
    }

    // Deduct credits
    const { error: deductError } = await adminClient
      .from('ai_images_creator_credits')
      .update({ credits: creditsData.credits - 1 })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Deduct credits error:', deductError);
      return NextResponse.json({ error: '扣除点数失败' }, { status: 500 });
    }

    creditsDeducted = true;

    // Step 2: Create history record
    const { data: historyData, error: historyError } = await adminClient
      .from('ai_images_creator_history')
      .insert({
        user_id: user.id,
        prompt: prompt,
        status: 'pending',
        metadata: { model: 'wanx2.1-t2i-plus' },
      })
      .select('id')
      .single();

    if (historyError || !historyData) {
      console.error('Create history error:', historyError);
      // Refund credits
      await adminClient
        .from('ai_images_creator_credits')
        .update({ credits: creditsData.credits })
        .eq('user_id', user.id);
      return NextResponse.json({ error: '创建记录失败' }, { status: 500 });
    }

    historyRecordId = historyData.id;

    // Step 3: Call DashScope API to create task
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx2.1-t2i-plus',
          input: {
            prompt: prompt,
          },
          parameters: {
            size: '1024*1024',
            n: 4,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      
      // Update history record with error
      await adminClient
        .from('ai_images_creator_history')
        .update({
          status: 'failed',
          error_message: errorData.message || '创建任务失败',
        })
        .eq('id', historyRecordId);

      // Refund credits
      await adminClient
        .from('ai_images_creator_credits')
        .update({ credits: creditsData.credits })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: errorData.message || '创建任务失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const taskId = data.output?.task_id;

    // Update history record with task_id
    if (taskId && historyRecordId) {
      await adminClient
        .from('ai_images_creator_history')
        .update({
          task_id: taskId,
          status: 'generating',
        })
        .eq('id', historyRecordId);
    }

    return NextResponse.json({
      ...data,
      history_id: historyRecordId,
    });
  } catch (error) {
    console.error('Generate image error:', error);

    // Refund credits if they were deducted
    if (creditsDeducted && historyRecordId) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const adminClient = createAdminClient();
          
          // Update history with error
          await adminClient
            .from('ai_images_creator_history')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : '未知错误',
            })
            .eq('id', historyRecordId);

          // Refund credits
          await adminClient.rpc('add_credits', { amount: 1 });
        }
      } catch (refundError) {
        console.error('Refund error:', refundError);
      }
    }

    return NextResponse.json(
      { error: '生成图片失败，请稍后重试' },
      { status: 500 }
    );
  }
}

