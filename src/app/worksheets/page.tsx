"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { toast } from "sonner";

export default function WorksheetsPage() {
  const [worksheets, setWorksheets] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorksheets = useCallback(async () => {
    try {
      const res = await fetch("/api/worksheets?limit=50");
      const data = await res.json();
      setWorksheets(data.worksheets || []);
    } catch {
      toast.error("加载试卷列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorksheets(); }, [fetchWorksheets]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
      setWorksheets((prev) => prev.filter((w) => w.id !== id));
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">试卷管理</h1>
        <Link href="/generate">
          <Button>生成新试卷</Button>
        </Link>
      </div>

      {worksheets.length === 0 ? (
        <EmptyState
          title="还没有试卷"
          description="从错题生成第一批练习卷"
          actionLabel="去生成题目"
          actionHref="/generate"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {worksheets.map((w) => (
            <Card key={w.id as string} className="p-4">
              <h3 className="font-semibold mb-2">{(w.title as string) || "未命名试卷"}</h3>
              <div className="text-xs text-gray-400 mb-1">
                纸张：{w.paper_size as string} | 题数：{(w.items_count as number) || "?"}
              </div>
              <div className="text-xs text-gray-400 mb-3">
                创建于：{new Date(w.created_at as string).toLocaleDateString("zh-CN")}
              </div>
              <div className="flex gap-2">
                <Link href={`/worksheets/${w.id}`}>
                  <Button size="sm" variant="outline">编辑排版</Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(w.id as string)}>
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
