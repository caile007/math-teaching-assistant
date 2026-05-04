import { z } from 'zod';

export const problemCreateSchema = z.object({
  photo: z.instanceof(File),
});

export const generateSchema = z.object({
  problem_ids: z.array(z.string()).min(1, '至少选择一道错题'),
  count_per_problem: z.number().min(1).max(5).default(2),
});

export const worksheetCreateSchema = z.object({
  title: z.string().min(1).default('未命名练习卷'),
  items: z.array(z.object({
    question_text: z.string().min(1),
    figure_svg: z.string().nullable(),
    question_type: z.enum(['choice', 'fill_in', 'calculation', 'proof']),
    answer_hint: z.string().nullable(),
    blank_height_mm: z.number().min(10).max(200).default(40),
    problem_id: z.string().nullable(),
  })),
});

export const worksheetUpdateSchema = z.object({
  title: z.string().optional(),
  margin_top: z.number().min(0).max(100).optional(),
  margin_bottom: z.number().min(0).max(100).optional(),
  margin_left: z.number().min(0).max(100).optional(),
  margin_right: z.number().min(0).max(100).optional(),
  items: z.array(z.object({
    id: z.string(),
    blank_height_mm: z.number().min(10).max(200),
    sort_order: z.number().min(0),
    question_text: z.string().optional(),
  })).optional(),
});
