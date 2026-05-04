"use client";

import type { QuestionType } from "@/types";

interface Item {
  id: string;
  question_text: string;
  figure_svg: string | null;
  question_type: QuestionType;
  blank_height_mm: number;
  sort_order: number;
}

const PAPER_ASPECT = 390 / 270; // 8K paper aspect ratio (height/width)
const SCALE = 0.5; // Preview scale: 1mm = 0.5px

interface Props {
  items: Item[];
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export function PaperPreview({ items, marginTop, marginBottom, marginLeft, marginRight }: Props) {
  const paperWidth = 270 * SCALE;
  const paperHeight = 390 * SCALE;
  const contentWidth = paperWidth - marginLeft * SCALE - marginRight * SCALE;
  const contentX = marginLeft * SCALE;
  const contentY = marginTop * SCALE;

  return (
    <div className="bg-white shadow-lg mx-auto" style={{ width: paperWidth, height: paperHeight, position: 'relative' }}>
      {/* Content area */}
      <div
        className="absolute border-l-2 border-r-2 border-blue-100"
        style={{
          left: contentX,
          top: contentY,
          width: contentWidth,
          height: paperHeight - contentY - marginBottom * SCALE,
        }}
      >
        {items.map((item, i) => (
          <div key={item.id} className="border-b border-gray-100 pb-1 mb-1" style={{ minHeight: 0 }}>
            {/* Question text */}
            <div className="text-xs text-gray-800 line-clamp-2 leading-tight" style={{ fontSize: 5 }}>
              {i + 1}. {item.question_text.replace(/\$[^$]+\$/g, '').substring(0, 60)}
            </div>

            {/* Figure placeholder */}
            {item.figure_svg && (
              <div className="bg-gray-50 border border-gray-200 mx-auto my-0.5" style={{ width: 40, height: 30 }}>
                <div className="text-xs text-gray-300 flex items-center justify-center h-full" style={{ fontSize: 5 }}>图</div>
              </div>
            )}

            {/* Blank answer area */}
            <div
              className="bg-gray-100 rounded"
              style={{ height: item.blank_height_mm * SCALE, marginTop: 2 }}
            />
          </div>
        ))}
      </div>

      {/* Page info */}
      <div className="absolute bottom-1 right-2 text-gray-300" style={{ fontSize: 6 }}>
        8K (270×390mm) | {items.length} 题
      </div>
    </div>
  );
}
