import { createClient } from '@libsql/client';
import type { Problem, Worksheet, WorksheetItem, WorksheetWithItems } from '@/types';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS problems (
      id            TEXT PRIMARY KEY,
      photo_url     TEXT NOT NULL,
      photo_key     TEXT NOT NULL,
      extracted_text TEXT NOT NULL DEFAULT '',
      figure_svg    TEXT,
      question_type TEXT DEFAULT 'calculation',
      subject       TEXT,
      topic         TEXT,
      difficulty    TEXT,
      student_note  TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worksheets (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL DEFAULT '未命名练习卷',
      paper_size    TEXT NOT NULL DEFAULT '8K',
      margin_top    INTEGER NOT NULL DEFAULT 1134,
      margin_bottom INTEGER NOT NULL DEFAULT 1134,
      margin_left   INTEGER NOT NULL DEFAULT 1417,
      margin_right  INTEGER NOT NULL DEFAULT 1417,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worksheet_items (
      id              TEXT PRIMARY KEY,
      worksheet_id    TEXT NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
      problem_id      TEXT REFERENCES problems(id) ON DELETE SET NULL,
      question_text   TEXT NOT NULL,
      figure_svg      TEXT,
      question_type   TEXT DEFAULT 'calculation',
      answer_hint     TEXT,
      blank_height_mm INTEGER NOT NULL DEFAULT 40,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_worksheet_items_worksheet ON worksheet_items(worksheet_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_worksheets_created_at ON worksheets(created_at DESC);
  `;
  await client.executeMultiple(sql);
}

// Problems
export async function listProblems(params: {
  subject?: string;
  page?: number;
  limit?: number;
}): Promise<{ problems: Problem[]; total: number }> {
  const { subject, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const args: Array<string | number> = [];
  let where = '';
  if (subject) {
    where = 'WHERE subject = ?';
    args.push(subject);
  }

  const [rows, countResult] = await Promise.all([
    client.execute(
      `SELECT * FROM problems ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    ),
    client.execute(`SELECT COUNT(*) as total FROM problems ${where}`, args),
  ]);

  return {
    problems: rows.rows as unknown as unknown[] as Problem[],
    total: (countResult.rows[0] as unknown as { total: number }).total,
  };
}

export async function getProblem(id: string): Promise<Problem | null> {
  const result = await client.execute('SELECT * FROM problems WHERE id = ?', [id]);
  return (result.rows[0] as unknown as Problem) || null;
}

export async function createProblem(problem: Problem): Promise<void> {
  await client.execute(
    `INSERT INTO problems (id, photo_url, photo_key, extracted_text, figure_svg, question_type, subject, topic, difficulty, student_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      problem.id, problem.photo_url, problem.photo_key, problem.extracted_text,
      problem.figure_svg, problem.question_type, problem.subject, problem.topic,
      problem.difficulty, problem.student_note,
    ]
  );
}

export async function deleteProblem(id: string): Promise<void> {
  await client.execute('DELETE FROM problems WHERE id = ?', [id]);
}

// Worksheets
export async function listWorksheets(params: {
  page?: number;
  limit?: number;
}): Promise<{ worksheets: Worksheet[]; total: number }> {
  const { page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    client.execute('SELECT * FROM worksheets ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
    client.execute('SELECT COUNT(*) as total FROM worksheets'),
  ]);

  return {
    worksheets: rows.rows as unknown as unknown as Worksheet[],
    total: (countResult.rows[0] as unknown as { total: number }).total,
  };
}

export async function getWorksheet(id: string): Promise<WorksheetWithItems | null> {
  const [ws, items] = await Promise.all([
    client.execute('SELECT * FROM worksheets WHERE id = ?', [id]),
    client.execute('SELECT * FROM worksheet_items WHERE worksheet_id = ? ORDER BY sort_order', [id]),
  ]);

  if (!ws.rows[0]) return null;

  return {
    ...(ws.rows[0] as unknown as unknown as Worksheet),
    items: items.rows as unknown as unknown as unknown[] as WorksheetItem[],
  };
}

export async function createWorksheet(ws: Worksheet, items: WorksheetItem[]): Promise<void> {
  await client.execute(
    `INSERT INTO worksheets (id, title, paper_size, margin_top, margin_bottom, margin_left, margin_right)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ws.id, ws.title, ws.paper_size, ws.margin_top, ws.margin_bottom, ws.margin_left, ws.margin_right]
  );

  for (const item of items) {
    await client.execute(
      `INSERT INTO worksheet_items (id, worksheet_id, problem_id, question_text, figure_svg, question_type, answer_hint, blank_height_mm, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.worksheet_id, item.problem_id, item.question_text,
        item.figure_svg, item.question_type, item.answer_hint, item.blank_height_mm, item.sort_order]
    );
  }
}

export async function updateWorksheet(
  id: string,
  data: { title?: string; margin_top?: number; margin_bottom?: number; margin_left?: number; margin_right?: number },
  items?: { id: string; blank_height_mm: number; sort_order: number; question_text?: string }[]
): Promise<void> {
  const fields: string[] = [];
  const args: Array<string | number> = [];

  if (data.title !== undefined) { fields.push('title = ?'); args.push(data.title); }
  if (data.margin_top !== undefined) { fields.push('margin_top = ?'); args.push(data.margin_top); }
  if (data.margin_bottom !== undefined) { fields.push('margin_bottom = ?'); args.push(data.margin_bottom); }
  if (data.margin_left !== undefined) { fields.push('margin_left = ?'); args.push(data.margin_left); }
  if (data.margin_right !== undefined) { fields.push('margin_right = ?'); args.push(data.margin_right); }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    args.push(id);
    await client.execute(`UPDATE worksheets SET ${fields.join(', ')} WHERE id = ?`, args);
  }

  if (items) {
    for (const item of items) {
      await client.execute(
        `UPDATE worksheet_items SET blank_height_mm = ?, sort_order = ?, question_text = COALESCE(?, question_text) WHERE id = ? AND worksheet_id = ?`,
        [item.blank_height_mm, item.sort_order, item.question_text ?? null, item.id, id]
      );
    }
  }
}

export async function deleteWorksheet(id: string): Promise<void> {
  await client.execute('DELETE FROM worksheets WHERE id = ?', [id]);
}
