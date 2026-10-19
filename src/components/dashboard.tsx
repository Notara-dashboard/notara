"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { useWorkspace } from "./workspace";
import { api } from "./record-list";
import { money } from "@/lib/domain";
import { DailyCapture } from "./daily-capture";
type Summary = {
  properties: number;
  premises: number;
  occupied: number;
  open_actions: number;
  high_priority: number;
  overdue: number;
  expiring: number;
  snapshot_date: string | null;
  debit: number;
  credit: number;
  events: { id: string; name: string; starts_at: string }[];
  actions: { id: string; name: string; due_date: string; priority: string }[];
};
export function Dashboard() {
  const [data, setData] = useState<Summary | null>(null),
    [error, setError] = useState(""),
    [rev, setRev] = useState(0),
    [customize, setCustomize] = useState(false);
  const { preferences, updatePreferences } = useWorkspace();
  useEffect(() => {
    const c = new AbortController();
    api("/api/dashboard", { signal: c.signal })
      .then((v) => {
        setData(v.data);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [rev]);
  const names: Record<string, string> = {
    brief: "Daily overview",
    metrics: "At a glance",
    agenda: "Schedule and priorities",
    portfolio: "Portfolio and financials",
    communications: "Communications",
  };
  const widgets: Record<string, React.ReactNode> = {
    brief: (
      <section className="brief-card">
        <span className="eyebrow">YOUR DAILY OVERVIEW</span>
        <h2>A clear view. A confident start.</h2>
        <p>
          {data?.properties
            ? `${data.properties} active properties and ${data.open_actions} open actions in your workspace.`
            : "Your workspace is ready for your real portfolio. Add a property, premises and tenants to begin."}
        </p>
        <Link className="text-link" href="/properties">
          Manage your properties →
        </Link>
      </section>
    ),
    metrics: (
      <section className="stats-grid">
        {[
          [
            "Open actions",
            data?.open_actions ?? 0,
            "actions",
            `${data?.overdue ?? 0} overdue`,
          ],
          [
            "Active properties",
            data?.properties ?? 0,
            "properties",
            "Oversight excluded",
          ],
          ["Lease expiries", data?.expiring ?? 0, "leases", "Within 60 days"],
          [
            "Gross debit",
            data?.snapshot_date ? money(Number(data.debit)) : "—",
            "financials",
            data?.snapshot_date
              ? `As of ${data.snapshot_date}`
              : "No finalised snapshot",
          ],
        ].map(([label, value, route, note]) => (
          <Link className="stat-card" href={`/${route}`} key={label}>
            <span>{label}</span>
            <strong className="stat-value">{value}</strong>
            <small>{note}</small>
          </Link>
        ))}
      </section>
    ),
    agenda: (
      <section className="two-column">
        <div className="panel live-panel">
          <h2>Your day ahead</h2>
          {data?.events.length ? (
            data.events.map((e) => (
              <Link className="live-summary-row" href="/calendar" key={e.id}>
                <span>{e.name}</span>
                <time>
                  {new Intl.DateTimeFormat("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(e.starts_at))}
                </time>
              </Link>
            ))
          ) : (
            <p className="muted-note">No events scheduled today.</p>
          )}
          <Link className="text-link" href="/calendar">
            Open calendar →
          </Link>
        </div>
        <div className="panel live-panel">
          <h2>What needs your attention</h2>
          {data?.actions.length ? (
            data.actions.map((a) => (
              <Link className="live-summary-row" href="/actions" key={a.id}>
                <span>{a.name}</span>
                <span className="badge">{a.priority}</span>
              </Link>
            ))
          ) : (
            <p className="muted-note">No open actions.</p>
          )}
          <Link className="text-link" href="/actions">
            Manage actions →
          </Link>
        </div>
      </section>
    ),
    portfolio: (
      <section className="panel live-panel">
        <h2>Your portfolio</h2>
        <div className="stats-grid">
          <div>
            <strong>
              {data?.premises
                ? `${Math.round((data.occupied / data.premises) * 1000) / 10}%`
                : "—"}
            </strong>
            <p>
              Lease coverage · {data?.occupied ?? 0} of {data?.premises ?? 0}{" "}
              recorded premises
            </p>
          </div>
          <div>
            <strong>
              {data?.snapshot_date ? money(Number(data.credit)) : "—"}
            </strong>
            <p>Credits · reported separately from gross debit</p>
          </div>
        </div>
        <p className="muted-note">
          Lease coverage reflects recorded current leases. Missing or incomplete
          schedules do not establish actual vacancy. Financials use the latest
          finalised snapshot for active properties.
        </p>
      </section>
    ),
    communications: (
      <section className="panel live-panel">
        <h2>Communications</h2>
        <p className="muted-note">
          Connect your email account to bring conversations into your workspace.
        </p>
        <Link className="text-link" href="/settings">
          Review integrations →
        </Link>
      </section>
    ),
  };
  return (
    <div className="page-content dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR DAY, BROUGHT INTO FOCUS</span>
          <h1>
            Today<span className="heading-dot">.</span>
          </h1>
          <p>Your properties, priorities and next steps.</p>
        </div>
        <div className="heading-actions">
          <Button
            variant="outline"
            onClick={() => setRev((v) => v + 1)}
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" onClick={() => setCustomize(true)}>
            <SlidersHorizontal size={16} />
            Customise
          </Button>
        </div>
      </div>
      {error ? (
        <div role="alert" className="panel live-panel">
          {error}
          <Button onClick={() => setRev((v) => v + 1)}>Retry</Button>
        </div>
      ) : !data ? (
        <div role="status" className="empty-state">
          Loading your workspace…
        </div>
      ) : (
        <div className="dashboard-widgets">
          <DailyCapture />
          {preferences.widgets
            .filter((w) => !preferences.hidden.includes(w))
            .map((w) => (
              <div key={w}>{widgets[w]}</div>
            ))}
        </div>
      )}
      <Dialog
        open={customize}
        onOpenChange={setCustomize}
        title="Customise dashboard"
        description="Saved to your account"
      >
        {preferences.widgets.map((w, i) => (
          <div className="customise-row" key={w}>
            <label>
              <input
                type="checkbox"
                checked={!preferences.hidden.includes(w)}
                onChange={() =>
                  void updatePreferences({
                    hidden: preferences.hidden.includes(w)
                      ? preferences.hidden.filter((v) => v !== w)
                      : [...preferences.hidden, w],
                  })
                }
              />
              {names[w]}
            </label>
            <Button
              variant="ghost"
              disabled={i === 0}
              aria-label={`Move ${names[w]} up`}
              onClick={() => {
                const widgets = [...preferences.widgets];
                [widgets[i - 1], widgets[i]] = [widgets[i], widgets[i - 1]];
                void updatePreferences({ widgets });
              }}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              disabled={i === preferences.widgets.length - 1}
              aria-label={`Move ${names[w]} down`}
              onClick={() => {
                const widgets = [...preferences.widgets];
                [widgets[i + 1], widgets[i]] = [widgets[i], widgets[i + 1]];
                void updatePreferences({ widgets });
              }}
            >
              ↓
            </Button>
          </div>
        ))}
      </Dialog>
    </div>
  );
}
