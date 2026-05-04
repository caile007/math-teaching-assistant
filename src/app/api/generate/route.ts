import { NextRequest, NextResponse } from 'next/server';
import { getProblem } from '@/lib/db';
import { generateSimilarQuestions } from '@/lib/deepseek';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem_ids, count_per_problem = 2 } = body;

    if (!problem_ids || !Array.isArray(problem_ids) || problem_ids.length === 0) {
      return NextResponse.json({ error: '请至少选择一道错题' }, { status: 400 });
    }

    // Fetch all source problems
    const problems = [];
    for (const id of problem_ids) {
      const problem = await getProblem(id);
      if (problem) {
        problems.push({
          text: problem.extracted_text,
          questionType: problem.question_type || 'calculation',
          figureDescription: problem.figure_svg ? '有配图' : null,
        });
      }
    }

    if (problems.length === 0) {
      return NextResponse.json({ error: '未找到有效错题' }, { status: 404 });
    }

    // Generate questions
    const questions = await generateSimilarQuestions(problems, count_per_problem);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to generate questions:', error);
    const message = error instanceof Error ? error.message : '题目生成失败';
    return NextResponse.json({ error: `AI生成失败：${message}` }, { status: 500 });
  }
}
