import { notFound } from "next/navigation";
import { ModulePage } from "@/components/module-page";
import { modules } from "@/lib/data";
export function generateStaticParams() {
  return modules.filter((m) => m.id !== "today").map((m) => ({ module: m.id }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const item = modules.find((m) => m.id === module && m.id !== "today");
  if (!item) notFound();
  return <ModulePage moduleId={item.id} />;
}
