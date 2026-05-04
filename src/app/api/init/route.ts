import { NextResponse } from 'next/server';
import { migrate } from '@/lib/db';

export async function POST() {
  try {
    await migrate();
    return NextResponse.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: '数据库初始化失败' }, { status: 500 });
  }
}
