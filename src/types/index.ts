// Shared TypeScript interfaces

export type QuestionType = 'choice' | 'fill_in' | 'calculation' | 'proof';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PaperSize = '8K' | 'A4';

export interface Problem {
  id: string;
  photo_url: string;
  photo_key: string;
  extracted_text: string;
  figure_svg: string | null;
  question_type: QuestionType;
  subject: string | null;
  topic: string | null;
  difficulty: Difficulty | null;
  student_note: string | null;
  created_at: string;
}

export interface Worksheet {
  id: string;
  title: string;
  paper_size: PaperSize;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  created_at: string;
  updated_at: string;
}

export interface WorksheetItem {
  id: string;
  worksheet_id: string;
  problem_id: string | null;
  question_text: string;
  figure_svg: string | null;
  question_type: QuestionType;
  answer_hint: string | null;
  blank_height_mm: number;
  sort_order: number;
  created_at: string;
}

export interface GeneratedQuestion {
  question_text: string;
  figure_svg: string | null;
  question_type: QuestionType;
  answer_hint: string | null;
}

export interface WorksheetWithItems extends Worksheet {
  items: WorksheetItem[];
}
