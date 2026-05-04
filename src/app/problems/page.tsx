"use client";

import { useCallback, useEffect, useState } from "react";
import type { Problem } from "@/types";
import { PhotoUploader } from "@/components/problems/PhotoUploader";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchProblems = useCallback(async () => {
    try {
      const res = await fetch("/api/problems?limit=50");
      const data = await res.json();
      setProblems(data.problems || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("加载错题列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const handleUploadComplete = useCallback(
    (problem: Problem) => {
      setProblems((prev) => [problem, ...prev]);
      setTotal((t) => t + 1);
    },
    []
  );

  const handleExtractComplete = useCallback(
    (updated: Problem) => {
      setProblems((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setProblems((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => t - 1);
        toast.success("已删除");
      } catch {
        toast.error("删除失败");
      }
    },
    []
  );

  if (loading) return <LoadingSkeleton />;

  const filtered = search
    ? problems.filter(
        (p) =>
          p.extracted_text?.includes(search) ||
          p.topic?.includes(search) ||
          p.subject?.includes(search)
      )
    : problems;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">错题收集</h1>

      {/* Upload area */}
      <PhotoUploader onUploadComplete={handleUploadComplete} onExtractComplete={handleExtractComplete} />

      {/* Search and stats */}
      {problems.length > 0 && (
        <div className="mt-6 flex items-center gap-4">
          <Input
            placeholder="搜索题目、知识点..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-gray-500">共 {total} 道错题</span>
          <Link href="/generate" className="ml-auto">
            <Button disabled={problems.length === 0}>生成题目 →</Button>
          </Link>
        </div>
      )}

      {/* Problem grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "没有匹配的错题" : "还没有收集错题"}
          description={
            search
              ? "试试其他关键词"
              : "拍照上传第一道学生错题，AI 将自动识别题目内容"
          }
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onDelete={handleDelete}
              onExtract={handleExtractComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
