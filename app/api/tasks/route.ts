import { createTask, listTasks } from "../../../db/tasks";

export async function GET() {
  try {
    return Response.json({ tasks: await listTasks() });
  } catch {
    return Response.json({ error: "تعذّر تحميل المهام. حاول مرة أخرى." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return Response.json({ error: "اكتب عنوان المهمة أولًا." }, { status: 400 });
    if (title.length > 160) return Response.json({ error: "عنوان المهمة طويل جدًا." }, { status: 400 });
    return Response.json({ task: await createTask(title) }, { status: 201 });
  } catch {
    return Response.json({ error: "تعذّرت إضافة المهمة. حاول مرة أخرى." }, { status: 500 });
  }
}
