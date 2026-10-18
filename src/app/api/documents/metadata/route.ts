import { authenticatedClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-security";
import { z } from "zod";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const body = z
    .object({
      id: z.uuid(),
      version: z.number().int().positive(),
      values: z
        .object({
          name: z.string().trim().min(1).max(200),
          notes: z.string().max(5000),
          property_id: z.uuid().nullable(),
          tenant_id: z.uuid().nullable(),
          lease_id: z.uuid().nullable(),
          meeting_id: z.uuid().nullable(),
        })
        .strict()
        .optional(),
      archive: z.boolean().optional(),
    })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json(
      { error: "Invalid document details." },
      { status: 400 },
    );
  const values: Record<string, unknown> = body.data.values || {};
  if (body.data.archive !== undefined)
    values.archived_at = body.data.archive ? new Date().toISOString() : null;
  if (!Object.keys(values).length)
    return Response.json({ error: "No changes supplied." }, { status: 400 });
  if (values.lease_id) {
    const { data, error } = await auth.client
      .from("leases")
      .select("property_id,tenant_id")
      .eq("owner_id", auth.user.id)
      .eq("id", values.lease_id)
      .maybeSingle();
    if (error || !data)
      return Response.json(
        { error: "The linked lease is unavailable." },
        { status: 400 },
      );
    values.property_id = data.property_id;
    values.tenant_id = data.tenant_id;
  }
  const { data, error } = await auth.client
    .from("documents")
    .update(values)
    .eq("owner_id", auth.user.id)
    .eq("id", body.data.id)
    .eq("version", body.data.version)
    .select()
    .maybeSingle();
  return error
    ? Response.json(
        { error: "Save failed. Check the linked records." },
        { status: 400 },
      )
    : !data
      ? Response.json(
          {
            error: "Document changed on another device. Refresh and try again.",
          },
          { status: 409 },
        )
      : Response.json({ data });
}
