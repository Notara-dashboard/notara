import { sameOrigin } from "@/lib/request-security";
import { authenticatedClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const { data, error } = await auth.client
      .from("documents")
      .select("object_path,name")
      .eq("owner_id", auth.user.id)
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle();
    if (error || !data)
      return Response.json({ error: "Document not found" }, { status: 404 });
    const { data: link, error: linkError } = await auth.client.storage
      .from("notara-private")
      .createSignedUrl(data.object_path, 60, { download: data.name });
    return linkError
      ? Response.json({ error: "Download unavailable" }, { status: 500 })
      : Response.json(
          { url: link.signedUrl },
          { headers: { "Cache-Control": "private, no-store" } },
        );
  }
  const page = Math.max(
    0,
    Number(new URL(request.url).searchParams.get("page")) || 0,
  );
  const { data, error, count } = await auth.client
    .from("documents")
    .select("id,name,size_bytes,content_type,created_at,version", {
      count: "exact",
    })
    .eq("owner_id", auth.user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range(page * 50, page * 50 + 49);
  return error
    ? Response.json({ error: "Documents unavailable" }, { status: 500 })
    : Response.json(
        { data, count },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const length = Number(request.headers.get("content-length"));
  if (length > 22 * 1024 * 1024)
    return Response.json({ error: "File exceeds 20 MB." }, { status: 413 });
  const form = await request.formData().catch(() => null),
    file = form?.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 20 * 1024 * 1024)
    return Response.json(
      { error: "Choose a file between 1 byte and 20 MB." },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder().decode(bytes.slice(0, 8));
  const types = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
    "text/csv",
  ];
  const valid =
    types.includes(file.type) &&
    (file.type === "application/pdf"
      ? header.startsWith("%PDF-")
      : file.type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : file.type === "image/png"
          ? bytes[0] === 137 && header.slice(1, 4) === "PNG"
          : !bytes.includes(0));
  if (!valid)
    return Response.json(
      {
        error:
          "Supported files: PDF, JPEG, PNG, plain text and CSV. File contents must match its type.",
      },
      { status: 400 },
    );
  const name =
    file.name.replace(/[\x00-\x1f/\\]/g, "_").slice(0, 200) || "document";
  const path = `${auth.user.id}/${crypto.randomUUID()}/${name}`;
  const { error } = await auth.client.storage
    .from("notara-private")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error)
    return Response.json(
      { error: "Upload failed. Please retry." },
      { status: 400 },
    );
  const { error: recordError } = await auth.client.from("documents").insert({
    owner_id: auth.user.id,
    name,
    object_path: path,
    content_type: file.type,
    size_bytes: file.size,
  });
  if (recordError) {
    await auth.client.storage.from("notara-private").remove([path]);
    return Response.json(
      { error: "Document record could not be saved. Please retry." },
      { status: 400 },
    );
  }
  return Response.json({ ok: true });
}
