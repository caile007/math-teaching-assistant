import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { listProblems, createProblem } from '@/lib/db';
import { extractProblemFromImage } from '@/lib/deepseek';
import { uploadPhoto } from '@/lib/blob';
import { compressImage } from '@/lib/image';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listProblems({ subject, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list problems:', error);
    return NextResponse.json({ error: '获取错题列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json({ error: '请上传照片' }, { status: 400 });
    }

    // Compress image
    const buffer = Buffer.from(await photo.arrayBuffer());
    const compressed = await compressImage(buffer);

    // Upload to Vercel Blob
    const key = `problems/${nanoid()}.webp`;
    const { url } = await uploadPhoto(compressed, key);

    // Convert to base64 for DeepSeek Vision
    const base64 = compressed.toString('base64');

    // Extract problem with AI
    let extracted;
    try {
      extracted = await extractProblemFromImage(base64, 'image/webp');
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      // Save with empty extraction - user can retry
      extracted = {
        problem_text: '',
        question_type: 'calculation',
        subject: null,
        topic: null,
        difficulty: null,
        figure_description: null,
      };
    }

    // Generate SVG from figure description if available
    let figureSvg = null;
    if (extracted.figure_description && extracted.figure_description !== 'null') {
      figureSvg = await generateFigureSvg(extracted.figure_description);
    }

    const problem = {
      id: `p_${nanoid()}`,
      photo_url: url,
      photo_key: key,
      extracted_text: extracted.problem_text || '',
      figure_svg: figureSvg,
      question_type: extracted.question_type || 'calculation',
      subject: extracted.subject,
      topic: extracted.topic,
      difficulty: extracted.difficulty,
      student_note: null,
      created_at: new Date().toISOString(),
    };

    await createProblem(problem);

    return NextResponse.json({ problem }, { status: 201 });
  } catch (error) {
    console.error('Failed to create problem:', error);
    return NextResponse.json({ error: '错题保存失败' }, { status: 500 });
  }
}

async function generateFigureSvg(description: string): Promise<string | null> {
  try {
    const { chatCompletion } = await import('@/lib/deepseek');
    const content = await chatCompletion(
      '你是一个几何图形SVG生成器。只输出SVG代码，不要其他文字。',
      `根据描述生成一个SVG几何图形：\n${description}\n\n要求：viewBox="0 0 400 300"，黑色实线，顶点用大写字母，14px字号，背景白色适合打印。\n只输出<svg>...</svg>，不加任何说明。`,
      { temperature: 0.1, maxTokens: 2048 }
    );
    if (!content) return null;
    const match = content.match(/<svg[\s\S]*?<\/svg>/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}
