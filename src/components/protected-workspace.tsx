import { authenticatedClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Workspace } from "./workspace";
export async function ProtectedWorkspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await authenticatedClient();
  if (!auth) redirect("/login");
  const { data, error } = await auth.client.rpc("workspace_access");
  if (error)
    throw new Error("Workspace access could not be checked. Please retry.");
  if (data !== true) redirect("/login?error=denied");
  return <Workspace email={auth.user.email || ""}>{children}</Workspace>;
}
