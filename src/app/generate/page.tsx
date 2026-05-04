"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LaTeXRenderer } from "@/components/shared/LaTeXRenderer";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

export default function GeneratePage() {
  const [problems, setProblems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [countPer, setCountPer] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Array<Record<string, unknown>>>([]);
  const [worksheetTitle, setWorksheetTitle] = useState("错题订正练习卷");
  const [showEditor, setShowEditor] = useState(false);

  // Load problems
  useState(() => {
    (async () => {
      try {
        const res = await fetch("/api/problems?limit=100");
        const data = await res.json();
        setProblems(data.problems || []);
      } catch {
        toast.error("加载错题失败");
      } finally {
        setLoading(false);
      }
    })();
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selected.size === 0) {
      toast.error("请先选择至少一道错题");
      return;
    }
    setGenerating(true);
    setGenerated([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_ids: Array.from(selected),
          count_per_problem: countPer,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }
      const data = await res.json();
      setGenerated(data.questions || []);
      setShowEditor(true);
      toast.success(`成功生成 ${data.questions?.length || 0} 道题目`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 生成失败");
    } finally {
      setGenerating(false);
    }
  }, [selected, countPer]);

  const handleSaveWorksheet = useCallback(async () => {
    try {
      const items = generated.map((q) => ({
        question_text: q.question_text,
        figure_svg: q.figure_svg,
        question_type: q.question_type || "calculation",
        answer_hint: q.answer_hint,
        blank_height_mm: 40,
      }));

      const res = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: worksheetTitle, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("试卷已保存");
      window.location.href = `/worksheets/${data.worksheet.id}`;
    } catch {
      toast.error("保存失败");
    }
  }, [generated, worksheetTitle]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-32 w-full" />))}
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">生成题目</h1>
        <EmptyState
          title="还没有错题"
          description="先收集一些错题，才能生成类似的练习题"
          actionLabel="去收集错题"
          actionHref="/problems"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">生成题目</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Select problems */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-3">1. 选择错题（已选 {selected.size} 道）</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {problems.map((p) => (
              <Card
                key={p.id as string}
                className={`p-3 cursor-pointer transition-colors ${
                  selected.has(p.id as string) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={() => toggleSelect(p.id as string)}
              >
                <div className="flex gap-3">
                  <img src={p.photo_url as string} alt="" className="w-20 h-20 object-cover rounded shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      <LaTeXRenderer text={p.extracted_text as string} />
                    </p>
                    <div className="flex gap-1 mt-1">
                      {(p.topic as string) && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.topic as string}</span>}
                      {(p.question_type as string) && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.question_type as string}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Settings */}
        <div>
          <Card className="p-4">
            <h2 className="font-semibold mb-3">2. 生成设置</h2>
            <div className="space-y-4">
              <div>
                <Label>每道题生成几道类似题</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={countPer}
                  onChange={(e) => setCountPer(parseInt(e.target.value) || 2)}
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={selected.size === 0 || generating}
              >
                {generating ? "AI 生成中..." : `生成 ${selected.size * countPer} 道题目`}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Generated results */}
      {generated.length > 0 && showEditor && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <h2 className="font-semibold mb-4">3. 生成结果预览</h2>

          <div className="space-y-4">
            {generated.map((q, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <span className="text-sm font-bold text-gray-400 shrink-0 w-6">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <LaTeXRenderer text={q.question_text as string} />
                    </p>
                    {(q.figure_svg as string) && (
                      <div
                        className="mt-2 border rounded p-2 bg-white inline-block"
                        dangerouslySetInnerHTML={{ __html: q.figure_svg as string }}
                      />
                    )}
                    {(q.answer_hint as string) && (
                      <p className="mt-2 text-xs text-gray-400">
                        答案提示：{(q.answer_hint as string)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Save to worksheet */}
          <Card className="mt-6 p-4">
            <div className="flex items-center gap-4">
              <Label className="shrink-0">试卷名称：</Label>
              <Input
                value={worksheetTitle}
                onChange={(e) => setWorksheetTitle(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSaveWorksheet} className="ml-auto">
                保存为试卷并编辑排版
              </Button>
            </div>
          </Card>
        </div>
      )}

      {generating && (
        <div className="mt-8 text-center py-12">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-gray-500">AI 正在生成类似题目，请稍候...</p>
        </div>
      )}
    </div>
  );
}
