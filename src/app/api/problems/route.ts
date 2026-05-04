import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { listProblems, createProblem } from '@/lib/db';
import { uploadPhoto } from '@/lib/blob';
import { compressImage } from '@/lib/image';

export const maxDuration = 30;

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

    // Compress and upload to blob (fast, ~3s)
    const buffer = Buffer.from(await photo.arrayBuffer());
    const compressed = await compressImage(buffer);
    const key = `problems/${nanoid()}.webp`;
    const { url } = await uploadPhoto(compressed, key);

    // Save immediately with empty text - AI extraction runs separately
    const problem = {
      id: `p_${nanoid()}`,
      photo_url: url,
      photo_key: key,
      extracted_text: '',
      figure_svg: null,
      question_type: 'calculation' as const,
      subject: null,
      topic: null,
      difficulty: null,
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
