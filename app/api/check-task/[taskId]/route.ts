import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: '任务ID不能为空' }, { status: 400 });
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

    // Query task status from DashScope
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || '查询任务失败' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const status = data.output?.task_status;

    // Use admin client for database operations
    const adminClient = createAdminClient();

    // Update history record based on task status
    if (status === 'SUCCEEDED') {
      const results = data.output?.results || [];
      const imageUrls = results.map((result: any) => result.url);

      await adminClient
        .from('ai_images_creator_history')
        .update({
          status: 'completed',
          image_urls: imageUrls,
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id);
    } else if (status === 'FAILED') {
      const errorMessage = data.output?.error_message || '生成失败';

      // Update history
      await adminClient
        .from('ai_images_creator_history')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      // Refund credits
      const { data: currentCredits } = await adminClient
        .from('ai_images_creator_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (currentCredits) {
        await adminClient
          .from('ai_images_creator_credits')
          .update({ credits: currentCredits.credits + 1 })
          .eq('user_id', user.id);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Check task error:', error);
    return NextResponse.json(
      { error: '查询任务状态失败' },
      { status: 500 }
    );
  }
}

