"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LaTeXRenderer } from "@/components/shared/LaTeXRenderer";
import type { Problem } from "@/types";

function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      variant === "secondary" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
    } ${className || ""}`}>
      {children}
    </span>
  );
}

const typeLabels: Record<string, string> = {
  choice: "选择题",
  fill_in: "填空题",
  calculation: "计算题",
  proof: "证明题",
};

const diffColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

interface Props {
  problem: Problem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function ProblemCard({ problem, selected, onSelect, onDelete, showActions = true }: Props) {
  return (
    <Card
      className={`p-4 relative ${selected ? "ring-2 ring-blue-500" : ""} ${onSelect ? "cursor-pointer" : ""}`}
      onClick={() => onSelect?.(problem.id)}
    >
      {/* Photo thumbnail */}
      <div className="mb-3 h-32 bg-gray-100 rounded overflow-hidden">
        <img
          src={problem.photo_url}
          alt="错题照片"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Text preview */}
      {problem.extracted_text ? (
        <div className="mb-2 text-sm text-gray-700 line-clamp-2">
          <LaTeXRenderer text={problem.extracted_text} />
        </div>
      ) : (
        <p className="mb-2 text-sm text-orange-600 italic">AI 识别中...</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {problem.question_type && (
          <Badge variant="secondary">{typeLabels[problem.question_type] || problem.question_type}</Badge>
        )}
        {problem.subject && <Badge variant="secondary">{problem.subject}</Badge>}
        {problem.topic && <Badge>{problem.topic}</Badge>}
      </div>

      {/* Difficulty */}
      {problem.difficulty && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${diffColors[problem.difficulty]}`}>
          {problem.difficulty === "easy" ? "简单" : problem.difficulty === "medium" ? "中等" : "较难"}
        </span>
      )}

      {/* Actions */}
      {showActions && onDelete && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(problem.id);
            }}
          >
            删除
          </Button>
        </div>
      )}
    </Card>
  );
}
