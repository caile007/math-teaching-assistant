import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { listWorksheets, createWorksheet } from '@/lib/db';
import type { QuestionType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listWorksheets({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list worksheets:', error);
    return NextResponse.json({ error: '获取试卷列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title = '未命名练习卷', items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '至少需要一道题目' }, { status: 400 });
    }

    const worksheetId = `ws_${nanoid()}`;
    const now = new Date().toISOString();

    const worksheet = {
      id: worksheetId,
      title,
      paper_size: '8K' as const,
      margin_top: 1134,
      margin_bottom: 1134,
      margin_left: 1417,
      margin_right: 1417,
      created_at: now,
      updated_at: now,
    };

    const worksheetItems = items.map((item: Record<string, unknown>, index: number) => ({
      id: `wi_${nanoid()}`,
      worksheet_id: worksheetId,
      problem_id: (item.problem_id as string) || null,
      question_text: item.question_text as string,
      figure_svg: (item.figure_svg as string) || null,
      question_type: (item.question_type as QuestionType) || 'calculation',
      answer_hint: (item.answer_hint as string) || null,
      blank_height_mm: (item.blank_height_mm as number) || 40,
      sort_order: index,
      created_at: now,
    }));

    await createWorksheet(worksheet, worksheetItems);

    return NextResponse.json({ worksheet: { ...worksheet, items: worksheetItems } }, { status: 201 });
  } catch (error) {
    console.error('Failed to create worksheet:', error);
    return NextResponse.json({ error: '创建试卷失败' }, { status: 500 });
  }
}
