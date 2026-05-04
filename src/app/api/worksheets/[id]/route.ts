import { NextRequest, NextResponse } from 'next/server';
import { getWorksheet, updateWorksheet, deleteWorksheet } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const worksheet = await getWorksheet(id);
    if (!worksheet) {
      return NextResponse.json({ error: '试卷不存在' }, { status: 404 });
    }
    return NextResponse.json({ worksheet });
  } catch (error) {
    console.error('Failed to get worksheet:', error);
    return NextResponse.json({ error: '获取试卷失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: {
      title?: string;
      margin_top?: number;
      margin_bottom?: number;
      margin_left?: number;
      margin_right?: number;
    } = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.margin_top !== undefined) data.margin_top = body.margin_top;
    if (body.margin_bottom !== undefined) data.margin_bottom = body.margin_bottom;
    if (body.margin_left !== undefined) data.margin_left = body.margin_left;
    if (body.margin_right !== undefined) data.margin_right = body.margin_right;

    await updateWorksheet(id, data, body.items);

    const updated = await getWorksheet(id);
    return NextResponse.json({ worksheet: updated });
  } catch (error) {
    console.error('Failed to update worksheet:', error);
    return NextResponse.json({ error: '更新试卷失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteWorksheet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete worksheet:', error);
    return NextResponse.json({ error: '删除试卷失败' }, { status: 500 });
  }
}
