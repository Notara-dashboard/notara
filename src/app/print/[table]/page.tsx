import { authenticatedClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { definitions } from "@/lib/domain";
import { PrintRecords } from "@/components/print-records";
export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  if (!definitions[table]) notFound();
  if (!(await authenticatedClient())) redirect("/login");
  return <PrintRecords table={table} />;
}
