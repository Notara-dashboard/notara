import { parse } from "csv-parse/sync";
import { definitions, recordSchema } from "./domain.ts";
import { parseAmount } from "./imports.ts";
import { z } from "zod";
export function readCollectionCSV(
  table: string,
  text: string,
  mapping: Record<string, string> = {},
  inspect = false,
) {
  const def = definitions[table];
  if (!def) throw new Error("Unknown collection");
  if (new TextEncoder().encode(text).length > 2 * 1024 * 1024)
    throw new Error("Split CSV files larger than 2 MB.");
  const grid = parse(text, {
    bom: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 150000,
  }) as string[][];
  const headers = grid.shift() || [];
  if (!headers.length || new Set(headers).size !== headers.length)
    throw new Error("Use unique column headings.");
  if (!grid.length || grid.length > 500)
    throw new Error("Import between 1 and 500 rows at a time.");
  const fields = [
    { key: "id", label: "id" },
    { key: "version", label: "version" },
    ...def.fields,
  ];
  const keys = headers.map(
    (h) =>
      mapping[h] ??
      fields.find(
        (f) =>
          f.key.toLowerCase() === h.toLowerCase() ||
          f.label.toLowerCase() === h.toLowerCase(),
      )?.key ??
      "",
  );
  if (new Set(keys.filter(Boolean)).size !== keys.filter(Boolean).length)
    throw new Error("Map each field once.");
  const rows = grid.map((values, i) => {
    if (inspect)
      return {
        id: undefined,
        version: undefined,
        values: {} as Record<string, unknown>,
      };
    const raw: Record<string, string> = {};
    values.forEach((v, j) => {
      if (keys[j]) raw[keys[j]] = v.replace(/^'(?=[\s]*[=+\-@])/, "");
    });
    const id = raw.id ? z.uuid().parse(raw.id) : undefined;
    const version = id
      ? z.number().int().positive().parse(Number(raw.version))
      : undefined;
    const payload: Record<string, unknown> = {};
    for (const f of def.fields) {
      if (!(f.key in raw)) continue;
      const v = raw[f.key];
      payload[f.key] =
        f.type === "number"
          ? v
            ? parseAmount(v)
            : null
          : f.relation || f.type === "date" || f.type === "datetime-local"
            ? v || null
            : v;
    }
    return { id, version, values: payload };
  });
  const ids = rows.map((r) => r.id).filter(Boolean);
  if (new Set(ids).size !== ids.length)
    throw new Error("An update ID appears more than once.");
  return { headers, keys, rows };
}
export function validateCollectionRow(
  table: string,
  values: Record<string, unknown>,
) {
  const parsed = recordSchema(table).safeParse(values);
  if (!parsed.success)
    throw new Error(
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  if (parsed.data.external_id === "") parsed.data.external_id = null;
  return parsed.data;
}
