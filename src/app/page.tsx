"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState({ problems: 0, worksheets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pr, wr] = await Promise.all([
          fetch("/api/problems?limit=1"),
          fetch("/api/worksheets?limit=1"),
        ]);
        const [pData, wData] = await Promise.all([pr.json(), wr.json()]);
        setStats({
          problems: pData.total || 0,
          worksheets: wData.total || 0,
        });
      } catch {
        // Dashboard is supplementary, silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">数学教学助手</h1>
        <p className="text-gray-500">拍照收集学生错题，AI 生成相似练习，导出 8K 打印试卷</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats.problems}</div>
          <div className="text-sm text-gray-500">已收集错题</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600 mb-1">{stats.worksheets}</div>
          <div className="text-sm text-gray-500">已生成试卷</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/problems">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold mb-1">收集错题</h3>
            <p className="text-sm text-gray-500">拍照上传学生错题，AI 自动识别题目和知识点</p>
            <span className="inline-block mt-4 px-3 py-1.5 text-sm border rounded-md">开始 →</span>
          </Card>
        </Link>

        <Link href="/generate">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold mb-1">生成题目</h3>
            <p className="text-sm text-gray-500">选择错题，AI 批量生成相似练习题，含几何配图</p>
            <span className="inline-block mt-4 px-3 py-1.5 text-sm border rounded-md">开始 →</span>
          </Card>
        </Link>

        <Link href="/worksheets">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="text-3xl mb-3">🖨️</div>
            <h3 className="font-semibold mb-1">试卷管理</h3>
            <p className="text-sm text-gray-500">调整排版和作答空白，下载 8K 纸张 Word 文档打印</p>
            <span className="inline-block mt-4 px-3 py-1.5 text-sm border rounded-md">开始 →</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
