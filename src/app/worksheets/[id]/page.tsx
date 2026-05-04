"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LaTeXRenderer } from "@/components/shared/LaTeXRenderer";
import { PaperPreview } from "@/components/worksheets/PaperPreview";
import { toast } from "sonner";

interface Item {
  id: string;
  question_text: string;
  figure_svg: string | null;
  question_type: string;
  answer_hint: string | null;
  blank_height_mm: number;
  sort_order: number;
}

interface WorksheetData {
  id: string;
  title: string;
  paper_size: string;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  items: Item[];
}

export default function WorksheetEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/worksheets/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setWorksheet(data.worksheet);
      } catch {
        toast.error("加载试卷失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-save
  const autoSave = useCallback(
    (data: WorksheetData) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/worksheets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: data.title,
              margin_top: Math.round(data.margin_top / 56.69),
              margin_bottom: Math.round(data.margin_bottom / 56.69),
              margin_left: Math.round(data.margin_left / 56.69),
              margin_right: Math.round(data.margin_right / 56.69),
              items: data.items.map((item) => ({
                id: item.id,
                blank_height_mm: item.blank_height_mm,
                sort_order: item.sort_order,
                question_text: item.question_text,
              })),
            }),
          });
        } catch {
          // Silently fail on auto-save
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [id]
  );

  const updateItem = useCallback(
    (itemId: string, field: string, value: number | string) => {
      setWorksheet((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
        autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  const moveItem = useCallback(
    (itemId: string, direction: "up" | "down") => {
      setWorksheet((prev) => {
        if (!prev) return prev;
        const idx = prev.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return prev;
        if (direction === "up" && idx === 0) return prev;
        if (direction === "down" && idx === prev.items.length - 1) return prev;

        const items = [...prev.items];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
        items.forEach((item, i) => { item.sort_order = i; });

        const next = { ...prev, items };
        autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  const updateMargin = useCallback(
    (field: string, value: number) => {
      setWorksheet((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [field]: value * 56.69 };
        autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/worksheets/${id}/download`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${worksheet?.title || "练习卷"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("下载完成");
    } catch {
      toast.error("下载失败");
    } finally {
      setDownloading(false);
    }
  }, [id, worksheet?.title]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-gray-500 text-center py-16">试卷不存在</p>
      </div>
    );
  }

  const marginTopMm = Math.round(worksheet.margin_top / 56.69);
  const marginBottomMm = Math.round(worksheet.margin_bottom / 56.69);
  const marginLeftMm = Math.round(worksheet.margin_left / 56.69);
  const marginRightMm = Math.round(worksheet.margin_right / 56.69);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Input
            value={worksheet.title}
            onChange={(e) => {
              setWorksheet((prev) => prev ? { ...prev, title: e.target.value } : prev);
              autoSave({ ...worksheet, title: e.target.value });
            }}
            className="text-2xl font-bold w-auto border-0 border-b-2 rounded-none px-0 focus-visible:ring-0"
          />
          <p className="text-sm text-gray-400 mt-1">
            {worksheet.items.length} 道题 | {worksheet.paper_size} 纸张
            {saving && " | 保存中..."}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={downloading} size="lg">
          {downloading ? "生成中..." : "下载 Word"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Question editor */}
        <div className="lg:col-span-2 space-y-4">
          {worksheet.items.map((item, idx) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {item.question_type === "choice" ? "选择题" :
                   item.question_type === "fill_in" ? "填空题" :
                   item.question_type === "proof" ? "证明题" : "计算题"}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, "up")} disabled={idx === 0}>
                    ↑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, "down")} disabled={idx === worksheet.items.length - 1}>
                    ↓
                  </Button>
                </div>
              </div>

              {/* Editable question text */}
              <textarea
                value={item.question_text}
                onChange={(e) => updateItem(item.id, "question_text", e.target.value)}
                className="w-full text-sm text-gray-700 border rounded p-2 min-h-[60px] resize-y"
                rows={3}
              />

              {/* SVG figure display */}
              {item.figure_svg && (
                <div className="mt-2 border rounded p-2 bg-white text-center">
                  <div dangerouslySetInnerHTML={{ __html: item.figure_svg }} />
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer">编辑 SVG 代码</summary>
                    <textarea
                      value={item.figure_svg}
                      onChange={(e) => updateItem(item.id, "figure_svg", e.target.value)}
                      className="w-full text-xs font-mono border rounded p-2 mt-1 min-h-[100px]"
                    />
                  </details>
                </div>
              )}

              {/* Blank area slider */}
              <div className="mt-3 flex items-center gap-3">
                <Label className="text-xs shrink-0">作答空白：</Label>
                <Slider
                  value={[item.blank_height_mm]}
                  onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; updateItem(item.id, "blank_height_mm", val); }}
                  min={10}
                  max={150}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-12 text-right">{item.blank_height_mm}mm</span>
              </div>

              {/* Answer hint */}
              {item.answer_hint && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-500 cursor-pointer">查看答案提示</summary>
                  <p className="text-xs text-gray-400 mt-1 p-2 bg-blue-50 rounded">
                    {item.answer_hint}
                  </p>
                </details>
              )}
            </Card>
          ))}
        </div>

        {/* Right: Preview + Margin controls */}
        <div className="space-y-4">
          {/* Margin settings */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">页边距设置 (mm)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">上边距</Label>
                <Input
                  type="number" min={5} max={50}
                  value={marginTopMm}
                  onChange={(e) => updateMargin("margin_top", parseInt(e.target.value) || 20)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">下边距</Label>
                <Input
                  type="number" min={5} max={50}
                  value={marginBottomMm}
                  onChange={(e) => updateMargin("margin_bottom", parseInt(e.target.value) || 20)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">左边距</Label>
                <Input
                  type="number" min={10} max={60}
                  value={marginLeftMm}
                  onChange={(e) => updateMargin("margin_left", parseInt(e.target.value) || 25)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">右边距</Label>
                <Input
                  type="number" min={10} max={60}
                  value={marginRightMm}
                  onChange={(e) => updateMargin("margin_right", parseInt(e.target.value) || 25)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Paper preview */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">8K 纸张预览</h3>
            <div className="bg-gray-200 p-2 rounded overflow-auto">
              <PaperPreview
                items={worksheet.items.map((item) => ({
                  id: item.id,
                  question_text: item.question_text,
                  figure_svg: item.figure_svg,
                  question_type: item.question_type as "choice" | "fill_in" | "calculation" | "proof",
                  blank_height_mm: item.blank_height_mm,
                  sort_order: item.sort_order,
                }))}
                marginTop={worksheet.margin_top}
                marginBottom={worksheet.margin_bottom}
                marginLeft={worksheet.margin_left}
                marginRight={worksheet.margin_right}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              8K 纸张 270×390mm | 预览为缩小效果
            </p>
          </Card>

          <Separator />

          <Button onClick={handleDownload} disabled={downloading} className="w-full" size="lg">
            {downloading ? "⏳ 生成 Word 中..." : "⬇ 下载 Word 文档"}
          </Button>
        </div>
      </div>
    </div>
  );
}
