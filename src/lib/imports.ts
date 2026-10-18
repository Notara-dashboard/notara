import { parse } from "csv-parse/sync";
import { z } from "zod";
export const importRowSchema = z
  .object({
    external_id: z.string().trim().min(1).max(160),
    tenant_name: z.string().trim().min(1).max(160),
    tenant_id: z.uuid().nullable(),
    property_id: z.uuid(),
    amount: z
      .number()
      .finite()
      .min(-999999999999)
      .max(999999999999)
      .multipleOf(0.01),
  })
  .strict();
export const batchSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    source_namespace: z.string().trim().min(1).max(80),
    source_hash: z.string().regex(/^[a-f0-9]{64}$/),
    as_of: z.iso.date(),
    rows: z.array(importRowSchema).min(1).max(2000),
  })
  .strict();
export function parseAmount(raw: string) {
  let value = raw.trim().replace(/^R\s*/i, "").replace(/\s/g, "");
  if (/^\(.+\)$/.test(value)) value = "-" + value.slice(1, -1);
  if (value.includes(",") && value.includes(".")) {
    if (!/^-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(value))
      throw new Error("Use an unambiguous amount with two decimal places.");
    value = value.replaceAll(",", "");
  } else if (value.includes(",")) {
    value = /^-?\d+,\d{1,2}$/.test(value)
      ? value.replace(",", ".")
      : value.replace(/,(?=\d{3}(?:,|$))/g, "");
  }
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a valid balance with at most two decimal places.");
  return Number(value);
}
export function parseImportCSV(text: string) {
  if (new TextEncoder().encode(text).length > 2 * 1024 * 1024)
    throw new Error("CSV is limited to 2 MB. Split larger files.");
  const headers =
    (
      parse(text, {
        bom: true,
        to: 1,
        skip_empty_lines: true,
        trim: true,
        max_record_size: 20000,
      }) as string[][]
    )[0] || [];
  if (new Set(headers.map((h) => h.toLowerCase())).size !== headers.length)
    throw new Error("CSV column names must be unique.");
  const records = parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    max_record_size: 20000,
  }) as Record<string, string>[];
  if (!records.length || records.length > 2000)
    throw new Error("Choose a CSV containing between 1 and 2,000 rows.");
  return { headers, records };
}
