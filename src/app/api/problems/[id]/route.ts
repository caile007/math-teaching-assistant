import { NextRequest, NextResponse } from 'next/server';
import { getProblem, deleteProblem } from '@/lib/db';
import { deletePhoto } from '@/lib/blob';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await getProblem(id);
    if (!problem) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }
    return NextResponse.json({ problem });
  } catch (error) {
    console.error('Failed to get problem:', error);
    return NextResponse.json({ error: '获取错题详情失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = await getProblem(id);
    if (!problem) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 });
    }

    // Delete photo from Blob
    if (problem.photo_key) {
      try { await deletePhoto(problem.photo_key); } catch {}
    }

    await deleteProblem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete problem:', error);
    return NextResponse.json({ error: '删除错题失败' }, { status: 500 });
  }
}
