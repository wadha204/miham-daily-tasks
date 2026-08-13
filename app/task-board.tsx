"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type Task = { id: number; title: string; completed: boolean; createdAt: string };
type Filter = "all" | "active" | "completed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "قيد التنفيذ" },
  { value: "completed", label: "المكتملة" },
];

function taskTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "الآن";
  return new Intl.DateTimeFormat("ar-QA", { hour: "numeric", minute: "2-digit" }).format(date);
}

async function responseMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks", { signal: controller.signal });
        if (!response.ok) throw new Error(await responseMessage(response, "تعذّر تحميل المهام."));
        const data = (await response.json()) as { tasks: Task[] };
        setTasks(data.tasks);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadTasks();
    return () => controller.abort();
  }, []);

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((task) => !task.completed);
    if (filter === "completed") return tasks.filter((task) => task.completed);
    return tasks;
  }, [filter, tasks]);
  const today = new Intl.DateTimeFormat("ar-QA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || adding) return;
    setAdding(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "تعذّرت إضافة المهمة."));
      const data = (await response.json()) as { task: Task };
      setTasks((current) => [data.task, ...current]);
      setTitle("");
      setFilter("all");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "تعذّرت إضافة المهمة.");
    } finally {
      setAdding(false);
    }
  }

  async function toggle(id: number) {
    if (busyIds.includes(id)) return;
    const previous = tasks;
    setBusyIds((current) => [...current, id]);
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
    setError("");
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
      if (!response.ok) throw new Error(await responseMessage(response, "تعذّر تحديث المهمة."));
      const data = (await response.json()) as { task: Task };
      setTasks((current) => current.map((task) => task.id === id ? data.task : task));
    } catch (toggleError) {
      setTasks(previous);
      setError(toggleError instanceof Error ? toggleError.message : "تعذّر تحديث المهمة.");
    } finally {
      setBusyIds((current) => current.filter((taskId) => taskId !== id));
    }
  }

  async function remove(id: number) {
    if (busyIds.includes(id)) return;
    const previous = tasks;
    setBusyIds((current) => [...current, id]);
    setTasks((current) => current.filter((task) => task.id !== id));
    setError("");
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseMessage(response, "تعذّر حذف المهمة."));
    } catch (deleteError) {
      setTasks(previous);
      setError(deleteError instanceof Error ? deleteError.message : "تعذّر حذف المهمة.");
    } finally {
      setBusyIds((current) => current.filter((taskId) => taskId !== id));
    }
  }

  return (
    <main className="app-shell">
      <aside className="side-panel">
        <div>
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true">م</span>
            <div>
              <p className="brand-name">مِهام</p>
              <p className="brand-note">مساحة هادئة لإنجاز يومك</p>
            </div>
          </div>
          <div className="date-block">
            <span className="date-eyebrow">اليوم</span>
            <p suppressHydrationWarning>{today}</p>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-ring" style={{ "--progress": `${progress}%` } as CSSProperties}>
            <div className="progress-ring-inner"><strong>{progress}٪</strong><span>منجَز</span></div>
          </div>
          <div className="progress-copy">
            <span>تقدّم اليوم</span>
            <strong>{remainingCount ? `${remainingCount} متبقية` : tasks.length ? "اكتمل اليوم" : "ابدأ بخطوة"}</strong>
          </div>
        </div>
        <p className="save-note"><span aria-hidden="true" /> تُحفظ مهامك تلقائيًا</p>
      </aside>

      <section className="workspace">
        <header className="hero-copy">
          <div className="eyebrow"><span /> قائمة اليوم</div>
          <h1>يومك، <em>مرتّب.</em></h1>
          <p>اكتب ما يشغل بالك، ثم خذها خطوة بخطوة.</p>
        </header>

        <form className="add-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="task-title">عنوان المهمة</label>
          <span className="input-plus" aria-hidden="true">＋</span>
          <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ما الذي تريد إنجازه؟" maxLength={160} autoComplete="off" />
          <button type="submit" disabled={!title.trim() || adding}>{adding ? "تتم الإضافة…" : "إضافة المهمة"}</button>
        </form>

        <div className="list-toolbar">
          <div className="filter-tabs" aria-label="تصفية المهام">
            {FILTERS.map((item) => (
              <button key={item.value} type="button" className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>
            ))}
          </div>
          <p><strong>{tasks.length}</strong> مهام · <strong>{completedCount}</strong> مكتملة</p>
        </div>

        {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="إغلاق الرسالة">×</button></div>}

        <div className="task-list" aria-live="polite" aria-busy={loading}>
          {loading ? (
            [0, 1, 2].map((item) => <div className="task-skeleton" key={item} />)
          ) : visibleTasks.length ? (
            visibleTasks.map((task) => {
              const busy = busyIds.includes(task.id);
              return (
                <article className={`task-item${task.completed ? " completed" : ""}`} key={task.id}>
                  <button type="button" className="task-check" onClick={() => void toggle(task.id)} disabled={busy} aria-label={task.completed ? `إعادة فتح ${task.title}` : `إكمال ${task.title}`}><span aria-hidden="true">✓</span></button>
                  <div className="task-content"><h2>{task.title}</h2><p>{task.completed ? "أُنجزت" : "أُضيفت"} · {taskTime(task.createdAt)}</p></div>
                  <button type="button" className="delete-button" onClick={() => void remove(task.id)} disabled={busy} aria-label={`حذف ${task.title}`}><span aria-hidden="true">×</span></button>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">✓</span>
              <h2>{filter === "completed" ? "لا توجد مهام مكتملة بعد" : filter === "active" ? "لا شيء متبقٍ الآن" : "القائمة جاهزة لأول مهمة"}</h2>
              <p>{filter === "all" ? "ابدأ بشيء صغير، فالخطوة الأولى تصنع الفرق." : "يمكنك العودة إلى كل المهام من التصفية أعلاه."}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
