import { notFound } from "next/navigation";
import { ModulePage } from "@/components/module-page";
import { modules } from "@/lib/data";
import { ProtectedWorkspace } from "@/components/protected-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const item = modules.find((m) => m.id === module && m.id !== "today");
  if (!item) notFound();
  return (
    <ProtectedWorkspace>
      <ModulePage moduleId={item.id} />
    </ProtectedWorkspace>
  );
}
