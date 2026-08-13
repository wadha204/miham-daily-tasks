import { deleteTask, toggleTask } from "../../../../db/tasks";

function parseTaskId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = parseTaskId((await context.params).id);
    if (!id) return Response.json({ error: "رقم المهمة غير صالح." }, { status: 400 });
    const task = await toggleTask(id);
    if (!task) return Response.json({ error: "المهمة غير موجودة." }, { status: 404 });
    return Response.json({ task });
  } catch {
    return Response.json({ error: "تعذّر تحديث المهمة. حاول مرة أخرى." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = parseTaskId((await context.params).id);
    if (!id) return Response.json({ error: "رقم المهمة غير صالح." }, { status: 400 });
    if (!(await deleteTask(id))) return Response.json({ error: "المهمة غير موجودة." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "تعذّر حذف المهمة. حاول مرة أخرى." }, { status: 500 });
  }
}
