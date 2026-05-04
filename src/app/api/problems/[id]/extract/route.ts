import { NextRequest, NextResponse } from 'next/server';
import { getProblem, createProblem } from '@/lib/db';
import { extractProblemFromImage, chatCompletion } from '@/lib/deepseek';

export const maxDuration = 60;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await getProblem(id);

    if (!problem) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    if (problem.extracted_text) {
      return NextResponse.json({ problem, message: '已识别，跳过' });
    }

    // Fetch photo from blob and convert to base64
    const photoRes = await fetch(problem.photo_url);
    if (!photoRes.ok) {
      return NextResponse.json({ error: '无法获取照片' }, { status: 500 });
    }
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
    const base64 = photoBuffer.toString('base64');

    // Extract problem text + metadata
    let extracted;
    try {
      extracted = await extractProblemFromImage(base64, 'image/webp');
    } catch {
      return NextResponse.json({
        error: 'AI识别失败，请重试',
        details: 'DeepSeek API 调用超时或出错',
      }, { status: 500 });
    }

    // Generate SVG from figure description if available
    let figureSvg = null;
    if (extracted.figure_description && extracted.figure_description !== 'null') {
      try {
        const content = await chatCompletion(
          '你是一个几何图形SVG生成器。只输出SVG代码，不要其他文字。',
          `根据描述生成一个SVG几何图形：\n${extracted.figure_description}\n\n要求：viewBox="0 0 400 300"，黑色实线，顶点用大写字母，14px字号，背景白色适合打印。\n只输出<svg>...</svg>，不加任何说明。`,
          { temperature: 0.1, maxTokens: 2048 }
        );
        if (content) {
          const match = content.match(/<svg[\s\S]*?<\/svg>/);
          if (match) figureSvg = match[0];
        }
      } catch {
        // SVG generation is optional
      }
    }

    // Update the problem in DB (re-insert with AI data)
    const updatedProblem = {
      ...problem,
      extracted_text: extracted.problem_text || '',
      figure_svg: figureSvg,
      question_type: extracted.question_type || problem.question_type,
      subject: extracted.subject || problem.subject,
      topic: extracted.topic || problem.topic,
      difficulty: extracted.difficulty || problem.difficulty,
    };

    // Delete old record and insert updated one
    const { deleteProblem } = await import('@/lib/db');
    await deleteProblem(id);
    await createProblem(updatedProblem);

    return NextResponse.json({ problem: updatedProblem });
  } catch (error) {
    console.error('Extract failed:', error);
    return NextResponse.json({ error: 'AI识别失败' }, { status: 500 });
  }
}
