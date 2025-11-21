import { NextRequest, NextResponse } from 'next/server';

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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Check task error:', error);
    return NextResponse.json(
      { error: '查询任务状态失败' },
      { status: 500 }
    );
  }
}

