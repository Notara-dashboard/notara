"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace, hrefFor } from "@/components/workspace";
import {
  tenants,
  properties,
  money,
  type ModuleId,
  type Action,
} from "@/lib/data";
export function Badge({
  children,
  color = "muted",
}: {
  children: ReactNode;
  color?: string;
}) {
  return <span className={`badge ${color}`}>{children}</span>;
}
export function Avatar({
  initials,
  color = "purple",
  small = false,
}: {
  initials: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <span className={`avatar ${color} ${small ? "avatar-small" : ""}`}>
      {initials}
    </span>
  );
}
export function CardHeading({
  icon,
  title,
  href,
  label = "View all",
  children,
}: {
  icon?: ReactNode;
  title: string;
  href?: string;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-heading">
      <h2>
        {icon}
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-link">
          {label}
          <ArrowUpRight size={14} />
        </Link>
      )}
      {children}
    </div>
  );
}
export function Stat({
  label,
  value,
  meta,
  icon,
  color = "blue",
  href,
}: {
  label: string;
  value: string | number;
  meta: ReactNode;
  icon: ReactNode;
  color?: string;
  href: string;
}) {
  return (
    <Link className="stat-card" href={href}>
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>{icon}</span>
      </div>
      <strong className="stat-value">
        {value}
        <ArrowUpRight size={17} />
      </strong>
      <div className="stat-meta">{meta}</div>
    </Link>
  );
}
export function ModuleEmpty({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state panel">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function ActionRow({
  action,
  compact = false,
}: {
  action: Action;
  compact?: boolean;
}) {
  const { toggleAction, openCapture } = useWorkspace();
  return (
    <div className={`action-row ${action.done ? "is-done" : ""}`}>
      <button
        className={`action-check ${action.done ? "checked" : ""}`}
        onClick={() => toggleAction(action.id)}
        aria-label={`${action.done ? "Reopen" : "Complete"} ${action.title}`}
        aria-pressed={action.done}
      >
        {action.done ? "✓" : ""}
      </button>
      <button
        className="action-description"
        onClick={() => openCapture(action)}
      >
        <strong>{action.title}</strong>
        <span>
          <Building2 size={11} />
          {action.property || "Personal"}
          <i />
          {action.due < "2026-10-17" ? (
            <em>Overdue</em>
          ) : action.due === "2026-10-17" ? (
            "Today"
          ) : (
            new Date(`${action.due}T12:00:00+02:00`).toLocaleDateString(
              "en-ZA",
              {
                day: "numeric",
                month: "short",
                timeZone: "Africa/Johannesburg",
              },
            )
          )}
        </span>
      </button>
      {!compact && (
        <Badge
          color={
            action.priority === "High"
              ? "pink"
              : action.priority === "Medium"
                ? "amber"
                : "muted"
          }
        >
          {action.priority}
        </Badge>
      )}
    </div>
  );
}
export function SourceLink({
  module,
  children,
}: {
  module: ModuleId;
  children: ReactNode;
}) {
  return (
    <Link className="source-link" href={hrefFor(module)}>
      <Link2 size={12} />
      {children}
      <ChevronRight size={12} />
    </Link>
  );
}
export function useRecordDetails() {
  const { showDetail, openCapture } = useWorkspace();
  return {
    tenant: (id: string) => {
      const t = tenants.find((t) => t.id === id);
      if (!t) return;
      showDetail({
        title: t.name,
        kind: `Sample tenant · ${t.id}`,
        content: (
          <div className="record-detail">
            <div className="detail-person">
              <Avatar initials={t.initials} color={t.color} />
              <div>
                <strong>{t.contact}</strong>
                <small>{t.email} · Example address</small>
              </div>
            </div>
            <dl>
              <div>
                <dt>Property / premises</dt>
                <dd>
                  {t.property} · Unit {t.unit}
                </dd>
              </div>
              <div>
                <dt>Lease expiry</dt>
                <dd>{t.lease}</dd>
              </div>
              <div>
                <dt>Sample balance</dt>
                <dd>{money(t.balance)}</dd>
              </div>
            </dl>
            <h4>Connected records</h4>
            <div className="related-links">
              <SourceLink module="properties">Property & premises</SourceLink>
              <SourceLink module="leases">Lease & terms</SourceLink>
              <SourceLink module="actions">Actions & follow-ups</SourceLink>
              <SourceLink module="communications">Correspondence</SourceLink>
              <SourceLink module="meetings">Meetings</SourceLink>
              <SourceLink module="turnover">Monthly turnover</SourceLink>
              <SourceLink module="financials">Arrears history</SourceLink>
              <SourceLink module="documents">Documents</SourceLink>
            </div>
            <p className="muted-note">
              Related links open the module preview; tenant-specific backend
              queries are part of the persistent-data milestone.
            </p>
          </div>
        ),
      });
    },
    property: (id: string) => {
      const p = properties.find((p) => p.id === id);
      if (!p) return;
      showDetail({
        title: p.name,
        kind: `Sample property · ${p.id}`,
        content: (
          <div className="record-detail">
            <img
              className="detail-property-image"
              src={p.image}
              alt={`Architectural illustration for ${p.name}`}
            />
            <Badge color={p.status === "Active" ? "teal" : "muted"}>
              {p.status}
            </Badge>
            <p>{p.address}</p>
            <dl>
              <div>
                <dt>Property type</dt>
                <dd>{p.type}</dd>
              </div>
              <div>
                <dt>Occupancy</dt>
                <dd>
                  {p.occupied} / {p.units} premises
                </dd>
              </div>
              <div>
                <dt>Gross debit exposure</dt>
                <dd>{money(p.arrears)}</dd>
              </div>
            </dl>
            <div className="related-links">
              <SourceLink module="tenants">Tenants & contacts</SourceLink>
              <SourceLink module="leases">Leases & vacancies</SourceLink>
              <SourceLink module="financials">Arrears & financials</SourceLink>
            </div>
            <Button className="w-full" onClick={() => openCapture()}>
              <CalendarDays size={16} />
              Create sample follow-up
            </Button>
          </div>
        ),
      });
    },
  };
}
export function exportCSV(
  filename: string,
  rows: (string | number | boolean)[][],
) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value);
          if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
