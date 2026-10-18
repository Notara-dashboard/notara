"use client";
import { useState } from "react";
import { modules, type ModuleId } from "@/lib/data";
import { moduleIcons, useWorkspace } from "./workspace";
import { RecordList } from "./record-list";
import { Button } from "./ui/button";
import { Documents } from "./documents";
import { PortfolioInsights } from "./portfolio-insights";
import { AuditHistory } from "./audit-history";
import { Calendar } from "./calendar";
const collections: Partial<Record<ModuleId, string[]>> = {
  properties: ["properties", "premises"],
  tenants: ["tenants", "contacts"],
  actions: ["actions"],
  calendar: ["events"],
  leases: ["leases"],
  financials: ["arrears_snapshots", "arrears_balances"],
  turnover: ["turnover_requirements", "turnover_submissions"],
};
export function ModulePage({ moduleId }: { moduleId: ModuleId }) {
  const [revision, setRevision] = useState(0);
  const module = modules.find((m) => m.id === moduleId)!;
  const Icon = moduleIcons[moduleId];
  return (
    <div className="page-content module-page">
      <div className="page-heading">
        <div>
          <span className="greeting-kicker">
            <Icon size={16} />
            {module.group}
          </span>
          <h1>{module.label}</h1>
          <p>{module.description}</p>
        </div>
      </div>
      {["leases", "turnover", "financials"].includes(moduleId) && (
        <PortfolioInsights
          key={moduleId + revision}
          kind={moduleId as "leases" | "turnover" | "financials"}
        />
      )}
      {moduleId === "calendar" && <Calendar revision={revision} />}
      {collections[moduleId] ? (
        <CollectionTabs
          key={moduleId}
          tables={collections[moduleId]!}
          onChanged={() => setRevision((v) => v + 1)}
        />
      ) : moduleId === "settings" ? (
        <Settings />
      ) : moduleId === "documents" ? (
        <Documents />
      ) : moduleId === "ai" ? (
        <Disconnected
          title="Notara AI"
          text="A model provider and authorised source retrieval must be configured before Notara can produce answers with citations."
        />
      ) : moduleId === "meetings" ? (
        <Disconnected
          title="Meeting intelligence"
          text="Schedule meetings in My Calendar. Recording, consent, transcription and source-linked summaries still require a processing provider."
        />
      ) : (
        <Disconnected
          title="Email is not connected"
          text="Email authorisation and synchronisation must be configured before messages can appear here."
        />
      )}
    </div>
  );
}
function CollectionTabs({
  tables,
  onChanged,
}: {
  tables: string[];
  onChanged: () => void;
}) {
  const [active, setActive] = useState(tables[0]);
  return (
    <>
      <div className="live-tabs" role="tablist" aria-label="Record collections">
        {tables.map((t) => (
          <Button
            key={t}
            role="tab"
            aria-selected={active === t}
            variant={active === t ? "default" : "outline"}
            onClick={() => setActive(t)}
          >
            {t.replaceAll("_", " ")}
          </Button>
        ))}
      </div>
      <RecordList key={active} table={active} onChange={onChanged} />
    </>
  );
}
function Disconnected({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel empty-state">
      <span className="badge amber">Setup required</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
function Settings() {
  const { email, preferences, updatePreferences } = useWorkspace();
  return (
    <>
      <section className="panel live-panel">
        <h2>Your account</h2>
        <p>{email}</p>
        <p className="muted-note">
          Invitation only. Every record is scoped to its authenticated owner.
        </p>
        <label className="customise-row">
          <span>Light theme</span>
          <input
            type="checkbox"
            checked={preferences.light}
            onChange={() =>
              void updatePreferences({ light: !preferences.light })
            }
          />
        </label>
      </section>
      <section className="panel live-panel">
        <h2>Connections</h2>
        <div className="live-summary-row">
          <span>Supabase · Notara-dashboard</span>
          <span className="badge teal">Connected</span>
        </div>
        {[
          "Google Calendar sync",
          "Gmail",
          "Google Drive",
          "OpenAI / Anthropic",
          "Meeting transcription",
        ].map((name) => (
          <div className="live-summary-row" key={name}>
            <span>{name}</span>
            <span className="badge amber">Not configured</span>
          </div>
        ))}
      </section>
      <section className="panel live-panel">
        <h2>Data protection</h2>
        <p>
          Private file access, account-scoped records, edit conflict detection,
          and audit history are enabled.
        </p>
        <p className="muted-note">
          Database and object backup restoration must be verified before
          production launch. This project currently uses the Supabase Free plan.
        </p>
      </section>
      <AuditHistory />
    </>
  );
}
