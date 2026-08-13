import { env } from "cloudflare:workers";

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

type TaskRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

let initialization: Promise<void> | undefined;

function database() {
  if (!env.DB) throw new Error("قاعدة بيانات المهام غير متاحة الآن.");
  return env.DB;
}

function normalizeTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export async function ensureTasksTable() {
  if (!initialization) {
    const db = database();
    initialization = db
      .batch([
        db.prepare(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_tasks_completed_id
          ON tasks (completed, id DESC)
        `),
        db.prepare("PRAGMA optimize"),
      ])
      .then(() => undefined)
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
  }
  await initialization;
}

export async function listTasks() {
  await ensureTasksTable();
  const result = await database()
    .prepare(`
      SELECT id, title, completed, created_at
      FROM tasks
      ORDER BY completed ASC, id DESC
    `)
    .all<TaskRow>();
  return result.results.map(normalizeTask);
}

export async function createTask(title: string) {
  await ensureTasksTable();
  const row = await database()
    .prepare(`
      INSERT INTO tasks (title, completed, created_at)
      VALUES (?, 0, ?)
      RETURNING id, title, completed, created_at
    `)
    .bind(title, new Date().toISOString())
    .first<TaskRow>();
  if (!row) throw new Error("تعذّر إنشاء المهمة.");
  return normalizeTask(row);
}

export async function toggleTask(id: number) {
  await ensureTasksTable();
  const row = await database()
    .prepare(`
      UPDATE tasks
      SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END
      WHERE id = ?
      RETURNING id, title, completed, created_at
    `)
    .bind(id)
    .first<TaskRow>();
  return row ? normalizeTask(row) : null;
}

export async function deleteTask(id: number) {
  await ensureTasksTable();
  const result = await database()
    .prepare("DELETE FROM tasks WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
