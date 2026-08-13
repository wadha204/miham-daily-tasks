import type { Metadata } from "next";
import { TaskBoard } from "./task-board";

export const metadata: Metadata = {
  title: "قائمة اليوم",
  description: "مدير مهام عربي بسيط وهادئ يساعدك على ترتيب يومك.",
};

export default function Home() {
  return <TaskBoard />;
}
