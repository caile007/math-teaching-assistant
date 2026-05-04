import { NextRequest, NextResponse } from 'next/server';
import { getWorksheet } from '@/lib/db';
import { generateDocx } from '@/lib/docx-generator';

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

    const buffer = await generateDocx(worksheet);

    const filename = encodeURIComponent(`${worksheet.title}.docx`);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to generate docx:', error);
    return NextResponse.json({ error: '生成Word文档失败' }, { status: 500 });
  }
}
