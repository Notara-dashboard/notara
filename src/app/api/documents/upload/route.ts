import { authenticatedClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-security";
import {
  maxUploadBytes,
  uploadTypes,
  safeFilename,
  validFile,
} from "@/lib/uploads";
import { z } from "zod";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const parsed = z
    .discriminatedUnion("action", [
      z
        .object({
          action: z.literal("init"),
          name: z.string().min(1).max(500),
          type: z.string().refine((v) => uploadTypes.includes(v)),
          size: z.number().int().positive().max(maxUploadBytes),
        })
        .strict(),
      z
        .object({
          action: z.enum(["complete", "cleanup"]),
          path: z.string().max(500),
        })
        .strict(),
    ])
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Choose a supported document up to 20 MB." },
      { status: 400 },
    );
  const data = parsed.data,
    bucket = auth.client.storage.from("notara-private");
  if (data.action === "init") {
    const path = `${auth.user.id}/${crypto.randomUUID()}/${safeFilename(data.name)}`;
    const { data: signed, error } = await bucket.createSignedUploadUrl(path, {
      upsert: false,
    });
    return error
      ? Response.json(
          { error: "Upload could not be prepared." },
          { status: 400 },
        )
      : Response.json({ path, token: signed.token });
  }
  const parts = data.path.split("/");
  if (
    parts.length !== 3 ||
    parts[0] !== auth.user.id ||
    !z.uuid().safeParse(parts[1]).success ||
    parts[2] !== safeFilename(parts[2])
  )
    return Response.json({ error: "Invalid document path" }, { status: 400 });
  const { data: existing, error: lookupError } = await auth.client
    .from("documents")
    .select("id")
    .eq("object_path", data.path)
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  if (lookupError)
    return Response.json(
      { error: "Upload could not be checked." },
      { status: 500 },
    );
  if (existing) return Response.json({ ok: true });
  if (data.action === "cleanup") {
    await bucket.remove([data.path]);
    return Response.json({ ok: true });
  }
  const { data: file, error } = await bucket.download(data.path);
  if (error || !file)
    return Response.json(
      { error: "The uploaded file was not found. Please retry." },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validFile(bytes, file.type)) {
    await bucket.remove([data.path]);
    return Response.json(
      { error: "File contents do not match a supported document type." },
      { status: 400 },
    );
  }
  const { error: saveError } = await auth.client.from("documents").insert({
    owner_id: auth.user.id,
    name: parts[2],
    object_path: data.path,
    content_type: file.type,
    size_bytes: file.size,
  });
  if (saveError && saveError.code !== "23505")
    return Response.json(
      {
        error:
          "Document metadata could not be saved. Retry to finish this upload.",
      },
      { status: 500 },
    );
  return Response.json({ ok: true });
}
