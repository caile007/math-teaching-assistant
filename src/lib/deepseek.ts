import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com/v1',
});

// Text-only chat completion
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
  });
  return response.choices[0].message.content;
}

// Vision completion with image
export async function visionCompletion(imageBase64: string, mimeType: string, prompt: string) {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });
  return response.choices[0].message.content;
}

// Extract math problem from image
export async function extractProblemFromImage(imageBase64: string, mimeType: string) {
  const prompt = `请识别这张图片中的数学题目。输出严格的JSON格式（不要包含其他内容）：

{
  "problem_text": "题目完整文字，数学公式用LaTeX写法包裹在\$...\$中（行内公式）或\$\$...\$\$中（独立公式）",
  "question_type": "choice" | "fill_in" | "calculation" | "proof",
  "subject": "代数/几何/函数/统计与概率/其他",
  "topic": "具体知识点名称，如一元二次方程、全等三角形、一次函数等",
  "difficulty": "easy" | "medium" | "hard",
  "figure_description": "如果题目有配图，请描述图形的几何结构和标注；如果没有配图，写null"
}

注意：只输出题目，不要解题。`;

  const content = await visionCompletion(imageBase64, mimeType, prompt);
  if (!content) throw new Error('DeepSeek returned empty response');

  // Extract JSON from content (in case there's surrounding text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse problem extraction JSON');

  return JSON.parse(jsonMatch[0]);
}

// Generate similar questions
export async function generateSimilarQuestions(
  originalProblems: { text: string; questionType: string; figureDescription?: string | null }[],
  countPerProblem: number
) {
  const problemsText = originalProblems.map((p, i) =>
    `原题${i + 1}：
题目：${p.text}
${p.figureDescription ? `配图描述：${p.figureDescription}` : ''}
题型：${p.questionType}`
  ).join('\n\n');

  const prompt = `你是一位初中数学教师，需要根据学生的错题生成类似的练习题。

---原题列表---
${problemsText}
---

请为每道原题生成 ${countPerProblem} 道类似的练习题。要求：
1. 保持相同题型和知识点
2. 图形结构相似但数据不同（换数字、换字母、换条件）
3. 难度与原题相近
4. 如果是几何题，需要生成配套的SVG图形代码

输出严格的JSON数组格式（不要包含其他内容）：
[{
  "original_index": 0,
  "question_text": "新题目文字，公式用LaTeX写法包裹",
  "figure_svg": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>（无图则为null）",
  "question_type": "choice|fill_in|calculation|proof",
  "answer_hint": "答案或解题提示"
}]

SVG图形要求：
- viewBox="0 0 400 300"，几何图形居中
- 顶点用大写字母标注，字体大小14px
- 三角形边用黑色实线(stroke-width:2)，辅助线用红色虚线(stroke-dasharray:5,5)
- 直角用小方块标记，角弧用小弧线
- 边长标注放在对应边旁边
- 背景白色，适合打印`;

  const content = await chatCompletion(
    '你是一位专业的初中数学教师，擅长根据错题生成针对性的练习题。只输出JSON，不要加任何额外文字。',
    prompt,
    { temperature: 0.5, maxTokens: 8192 }
  );

  if (!content) throw new Error('DeepSeek returned empty response');

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse generated questions JSON');

  return JSON.parse(jsonMatch[0]);
}
