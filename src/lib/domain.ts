import { z } from "zod";

export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "date"
    | "datetime-local"
    | "number"
    | "textarea"
    | "select";
  required?: boolean;
  options?: string[];
  relation?: string;
  min?: number;
};
export type Definition = { label: string; singular: string; fields: Field[] };
const name: Field = { key: "name", label: "Name", required: true };
const notes: Field = { key: "notes", label: "Notes", type: "textarea" };
const relation = (
  key: string,
  label: string,
  table: string,
  required = false,
): Field => ({ key, label, relation: table, required, type: "select" });
const date = (key: string, label: string, required = true): Field => ({
  key,
  label,
  required,
  type: "date",
});
export const definitions: Record<string, Definition> = {
  properties: {
    label: "Properties",
    singular: "property",
    fields: [
      name,
      { key: "address", label: "Address" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["active", "oversight", "archived"],
        required: true,
      },
      { key: "property_type", label: "Property type" },
      notes,
    ],
  },
  premises: {
    label: "Premises",
    singular: "premises",
    fields: [
      name,
      relation("property_id", "Property", "properties", true),
      { key: "area", label: "Area (m²)", type: "number", min: 0 },
      notes,
    ],
  },
  tenants: {
    label: "Tenants",
    singular: "tenant",
    fields: [
      name,
      { key: "registration", label: "Registration number" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      {
        key: "external_id",
        label: "External identifier (optional, unique per owner)",
      },
      notes,
    ],
  },
  contacts: {
    label: "Contacts",
    singular: "contact",
    fields: [
      name,
      relation("tenant_id", "Tenant", "tenants"),
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role" },
      notes,
    ],
  },
  actions: {
    label: "Actions",
    singular: "action",
    fields: [
      name,
      relation("property_id", "Property", "properties"),
      relation("tenant_id", "Tenant", "tenants"),
      date("due_date", "Due date", false),
      relation("meeting_id", "Source meeting", "meetings"),
      relation("communication_id", "Source communication", "communications"),
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["Medium", "High", "Low"],
        required: true,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["open", "done"],
        required: true,
      },
      notes,
    ],
  },
  leases: {
    label: "Leases",
    singular: "lease",
    fields: [
      name,
      relation("property_id", "Property", "properties", true),
      relation("premises_id", "Premises", "premises", true),
      relation("tenant_id", "Tenant", "tenants", true),
      date("start_date", "Start date"),
      date("end_date", "End date"),
      {
        key: "monthly_rent",
        label: "Monthly rent (ZAR)",
        type: "number",
        min: 0,
        required: true,
      },
      notes,
    ],
  },
  events: {
    label: "Calendar events",
    singular: "event",
    fields: [
      name,
      relation("property_id", "Property", "properties"),
      {
        key: "starts_at",
        label: "Starts (South Africa time)",
        type: "datetime-local",
        required: true,
      },
      {
        key: "ends_at",
        label: "Ends (South Africa time)",
        type: "datetime-local",
        required: true,
      },
      { key: "location", label: "Location" },
      notes,
    ],
  },
  turnover_requirements: {
    label: "Reporting requirements",
    singular: "reporting requirement",
    fields: [
      name,
      relation("tenant_id", "Tenant", "tenants", true),
      date("start_date", "Reporting starts"),
      date("end_date", "Reporting ends", false),
      notes,
    ],
  },
  turnover_submissions: {
    label: "Turnover returns",
    singular: "turnover return",
    fields: [
      name,
      relation("requirement_id", "Requirement", "turnover_requirements", true),
      date("period", "Month (first day of month)"),
      {
        key: "amount",
        label: "Reported turnover (ZAR)",
        type: "number",
        min: 0,
        required: true,
      },
      notes,
    ],
  },
  arrears_snapshots: {
    label: "Dated snapshots",
    singular: "snapshot",
    fields: [
      name,
      date("as_of", "As of"),
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "finalised"],
        required: true,
      },
      notes,
    ],
  },
  arrears_balances: {
    label: "Snapshot balances",
    singular: "balance",
    fields: [
      name,
      relation("snapshot_id", "Draft snapshot", "arrears_snapshots", true),
      relation("property_id", "Property", "properties", true),
      relation("tenant_id", "Tenant", "tenants", true),
      {
        key: "amount",
        label: "Balance (ZAR; positive debit, negative credit)",
        type: "number",
        required: true,
      },
      notes,
    ],
  },
  meetings: {
    label: "Meetings",
    singular: "meeting",
    fields: [
      name,
      relation("property_id", "Property", "properties"),
      {
        key: "starts_at",
        label: "Meeting time (SAST)",
        type: "datetime-local",
        required: true,
      },
      { key: "participants", label: "Participants" },
      {
        key: "consent",
        label: "Recording consent",
        type: "select",
        options: ["not_recording", "consent_recorded"],
        required: true,
      },
      notes,
      { key: "decisions", label: "Decisions", type: "textarea" },
    ],
  },
  communications: {
    label: "Communications",
    singular: "communication",
    fields: [
      name,
      relation("property_id", "Property", "properties"),
      relation("tenant_id", "Tenant", "tenants"),
      {
        key: "channel",
        label: "Channel",
        type: "select",
        options: ["Note", "Phone", "Email", "WhatsApp", "Letter"],
        required: true,
      },
      { key: "contact", label: "Contact" },
      {
        key: "occurred_at",
        label: "Date and time (SAST)",
        type: "datetime-local",
        required: true,
      },
      notes,
    ],
  },
};
export type RecordRow = {
  id: string;
  owner_id: string;
  name: string;
  version: number;
  archived_at: string | null;
  [key: string]: unknown;
};
const isDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function recordSchema(table: string) {
  const def = definitions[table];
  if (!def) throw new Error("Unknown record type");
  const shape: Record<string, z.ZodType> = {};
  for (const field of def.fields) {
    let schema: z.ZodType;
    if (field.relation) schema = z.uuid().nullable();
    else if (field.type === "number")
      schema = z
        .number()
        .finite()
        .min(field.min ?? -999999999999)
        .max(999999999999)
        .multipleOf(0.01)
        .nullable();
    else if (field.options)
      schema = z.enum(field.options as [string, ...string[]]);
    else if (field.type === "date")
      schema = z.string().refine(isDate, "Enter a valid date").nullable();
    else if (field.type === "datetime-local")
      schema = z.iso.datetime({ offset: true }).nullable();
    else if (field.type === "email")
      schema = z.union([z.email(), z.literal("")]);
    else
      schema = z
        .string()
        .trim()
        .max(
          field.type === "textarea" ? 5000 : field.key === "name" ? 160 : 500,
        );
    if (field.required)
      schema = schema.refine(
        (v) => v !== null && v !== "",
        "This field is required",
      );
    else
      schema = schema.default(
        field.relation ||
          ["date", "datetime-local", "number"].includes(field.type || "")
          ? null
          : field.options?.[0] || "",
      );
    shape[field.key] = schema;
  }
  return z
    .object(shape)
    .strict()
    .superRefine((v, ctx) => {
      if (
        v.start_date &&
        v.end_date &&
        String(v.end_date) < String(v.start_date)
      )
        ctx.addIssue({
          code: "custom",
          message: "End date must follow start date",
          path: ["end_date"],
        });
      if (
        v.starts_at &&
        v.ends_at &&
        Date.parse(String(v.ends_at)) <= Date.parse(String(v.starts_at))
      )
        ctx.addIssue({
          code: "custom",
          message: "End must follow start",
          path: ["ends_at"],
        });
      if (v.period && String(v.period).slice(-2) !== "01")
        ctx.addIssue({
          code: "custom",
          message: "Use the first day of the reporting month",
          path: ["period"],
        });
    });
}
export const preferenceSchema = z
  .object({
    light: z.boolean(),
    collapsed: z.boolean(),
    hidden: z
      .array(
        z.enum(["brief", "metrics", "agenda", "portfolio", "communications"]),
      )
      .max(5),
    widgets: z
      .array(
        z.enum(["brief", "metrics", "agenda", "portfolio", "communications"]),
      )
      .length(5)
      .refine((v) => new Set(v).size === 5),
    filters: z.record(z.string().max(40), z.string().max(100)).default({}),
  })
  .strict();
export const defaultPreferences = {
  light: false,
  collapsed: false,
  hidden: [],
  widgets: ["brief", "metrics", "agenda", "portfolio", "communications"],
  filters: {},
};
export const money = (v: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(v);
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
