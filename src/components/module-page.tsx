"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  HardDrive,
  LayoutGrid,
  ListFilter,
  Mail,
  Mic,
  MoreHorizontal,
  Plug,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  ActionRow,
  Avatar,
  Badge,
  CardHeading,
  exportCSV,
  ModuleEmpty,
  SourceLink,
  Stat,
  useRecordDetails,
} from "@/components/shared";
import { moduleIcons, useWorkspace } from "@/components/workspace";
import {
  exposure,
  meetings,
  messages,
  modules,
  money,
  portfolio,
  previewDate,
  properties,
  tenants,
  type ModuleId,
} from "@/lib/data";
import dynamic from "next/dynamic";
const ExposureChart = dynamic(() => import("@/components/exposure-chart"), {
  ssr: false,
  loading: () => (
    <div className="exposure-chart chart-loading">Loading exposure chart…</div>
  ),
});

export function ModulePage({ moduleId }: { moduleId: ModuleId }) {
  const module = modules.find((m) => m.id === moduleId)!;
  const Icon = moduleIcons[moduleId];
  const { openCapture, openAI, showDetail } = useWorkspace();
  return (
    <div className="page-content module-page">
      <div className="page-heading">
        <div>
          <span className="greeting-kicker">
            <Icon size={14} />
            {module.group === "SETTINGS" ? "YOUR WORKSPACE" : module.group}
          </span>
          <h1>{module.label}</h1>
          <p>{module.description}</p>
        </div>
        <div className="heading-actions">
          {moduleId === "actions" ? (
            <Button onClick={() => openCapture()}>
              <Plus size={16} />
              New action
            </Button>
          ) : moduleId === "ai" ? (
            <Button onClick={() => openAI()}>
              <Sparkles size={16} />
              Ask Notara
            </Button>
          ) : (
            moduleId !== "settings" && (
              <Button
                variant="outline"
                onClick={() =>
                  showDetail({
                    title: "A foundation for your real workspace",
                    kind: "First milestone · Visual foundation",
                    content: (
                      <div className="record-detail">
                        <p>
                          You’re exploring labelled sample records. Navigation,
                          sample action capture, filters, exports and
                          preferences work in this preview.
                        </p>
                        <p>
                          Private sign-in and database-backed creation, editing,
                          archival, attachments and audit history are the next
                          milestone. Integrations remain disconnected.
                        </p>
                        <SourceLink module="settings">
                          Review connection status
                        </SourceLink>
                      </div>
                    ),
                  })
                }
              >
                <CircleAlert size={15} />
                About this preview
              </Button>
            )
          )}
        </div>
      </div>
      {moduleId === "properties" && <PropertiesPage />}
      {moduleId === "tenants" && <TenantsPage />}
      {moduleId === "actions" && <ActionsPage />}
      {moduleId === "calendar" && <CalendarPage />}
      {moduleId === "meetings" && <MeetingsPage />}
      {moduleId === "communications" && <CommunicationsPage />}
      {moduleId === "financials" && <FinancialsPage />}
      {moduleId === "turnover" && <TurnoverPage />}
      {moduleId === "leases" && <LeasesPage />}
      {moduleId === "documents" && <DocumentsPage />}
      {moduleId === "ai" && <AIPage />}
      {moduleId === "settings" && <SettingsPage />}
    </div>
  );
}
function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="filter-search">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function PropertiesPage() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("Active");
  const [sort, setSort] = useState("name");
  const record = useRecordDetails();
  const filtered = properties
    .filter(
      (p) =>
        (scope === "All properties" || p.status === scope) &&
        `${p.name} ${p.address}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.occupied / b.units - a.occupied / a.units,
    );
  return (
    <>
      <div className="module-callout">
        <ShieldCheck size={18} />
        <span>
          Only <strong>active properties</strong> contribute to your personal
          dashboard. Oversight properties stay in view without changing your
          totals.
        </span>
      </div>
      <div className="stats-grid three-stats">
        <Stat
          label="Active properties"
          value={portfolio.properties}
          meta="Your personal portfolio"
          icon={<Building2 size={18} />}
          href="/properties"
        />
        <Stat
          label="Occupied premises"
          value={`${portfolio.occupied} / ${portfolio.units}`}
          meta="92.6% occupancy"
          icon={<Users size={18} />}
          color="teal"
          href="/tenants"
        />
        <Stat
          label="Available premises"
          value="4"
          meta="Across 3 active properties"
          icon={<LayoutGrid size={18} />}
          color="purple"
          href="/leases"
        />
      </div>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find a property..."
        />
        <div className="toolbar-right">
          <select
            aria-label="Property scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option>Active</option>
            <option>Oversight only</option>
            <option>Archived / handed over</option>
            <option>All properties</option>
          </select>
          <select
            aria-label="Sort properties"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="occupancy">Highest occupancy</option>
          </select>
          <Button
            variant="outline"
            onClick={() =>
              exportCSV("notara-sample-properties.csv", [
                ["Sample data only"],
                ["Property", "Status", "Units", "Occupied"],
                ...filtered.map((p) => [p.name, p.status, p.units, p.occupied]),
              ])
            }
          >
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>
      <div className="property-grid">
        {filtered.map((p) => (
          <button
            className="property-card panel"
            key={p.id}
            onClick={() => record.property(p.id)}
          >
            <div className="property-art">
              <img
                src={p.image}
                alt={`Architectural illustration of ${p.name}`}
              />
              <Badge color={p.status === "Active" ? "teal" : "muted"}>
                {p.status}
              </Badge>
              <span className="property-type">{p.type}</span>
            </div>
            <div className="property-body">
              <div className="property-name">
                <h2>{p.name}</h2>
                <ArrowUpRight size={18} />
              </div>
              <p>{p.address}</p>
              <div className="property-card-stats">
                <span>
                  <strong>{p.units}</strong>
                  <small>Premises</small>
                </span>
                <span>
                  <strong>{Math.round((p.occupied / p.units) * 100)}%</strong>
                  <small>Occupied</small>
                </span>
                <span>
                  <strong>{p.units - p.occupied}</strong>
                  <small>Vacant</small>
                </span>
              </div>
              <div className="occupancy-bar">
                <i style={{ width: `${(p.occupied / p.units) * 100}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <ModuleEmpty
          icon={<Building2 size={28} />}
          title="No properties in this view"
          text="Try another status or a different search."
        />
      )}
      <p className="muted-note">
        Architectural illustrations and property records are sample content.
        Persistent property forms arrive in the next milestone.
      </p>
    </>
  );
}
function TenantsPage() {
  const [query, setQuery] = useState("");
  const [property, setProperty] = useState("All properties");
  const record = useRecordDetails();
  const rows = tenants.filter(
    (t) =>
      (property === "All properties" || t.property === property) &&
      `${t.name} ${t.contact} ${t.unit}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search tenants or contacts..."
        />
        <div className="toolbar-right">
          <select
            aria-label="Filter by property"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
          >
            <option>All properties</option>
            {properties.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() =>
              exportCSV("notara-sample-tenants.csv", [
                ["Sample data only"],
                ["Tenant", "Contact", "Property", "Premises", "Lease expiry"],
                ...rows.map((t) => [
                  t.name,
                  t.contact,
                  t.property,
                  t.unit,
                  t.lease,
                ]),
              ])
            }
          >
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>
      <div className="panel">
        <CardHeading title="The people in your portfolio">
          <Badge>{rows.length} sample tenants</Badge>
        </CardHeading>
        <Table
          headers={[
            "Tenant / legal entity",
            "Property & premises",
            "Primary contact",
            "Lease expiry",
            "Balance",
            "",
          ]}
        >
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <button
                  className="table-person"
                  onClick={() => record.tenant(t.id)}
                >
                  <Avatar initials={t.initials} color={t.color} />
                  <span>
                    <strong>{t.name}</strong>
                    <small>Sample legal entity</small>
                  </span>
                </button>
              </td>
              <td>
                {t.property}
                <small>Unit {t.unit}</small>
              </td>
              <td>
                {t.contact}
                <small>{t.email}</small>
              </td>
              <td>{t.lease}</td>
              <td>
                <Badge
                  color={
                    t.balance > 0 ? "pink" : t.balance < 0 ? "blue" : "teal"
                  }
                >
                  {money(t.balance)}
                </Badge>
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`View ${t.name}`}
                  onClick={() => record.tenant(t.id)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && (
          <div className="empty-state">No tenants match this view.</div>
        )}
      </div>
    </>
  );
}
function ActionsPage() {
  const { actions, openCapture, archiveAction, toast } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Open");
  const [sort, setSort] = useState("due");
  useEffect(() => {
    try {
      const value = localStorage.getItem("notara.action-filter.v1");
      if (
        value &&
        ["Open", "High priority", "Overdue", "Completed", "Archived"].includes(
          value,
        )
      )
        setFilter(value);
    } catch {}
  }, []);
  const changeFilter = (value: string) => {
    setFilter(value);
    try {
      localStorage.setItem("notara.action-filter.v1", value);
    } catch {}
  };
  const rows = actions
    .filter(
      (a) =>
        `${a.title} ${a.property} ${a.tenant}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "Archived"
          ? a.archived
          : !a.archived &&
            (filter === "Completed"
              ? a.done
              : !a.done &&
                (filter === "High priority"
                  ? a.priority === "High"
                  : filter === "Overdue"
                    ? a.due < previewDate
                    : true))),
    )
    .sort((a, b) =>
      sort === "due"
        ? a.due.localeCompare(b.due)
        : a.title.localeCompare(b.title),
    );
  return (
    <>
      <div className="module-callout">
        <ListFilter size={17} />
        <span>
          Sample actions and your last filter are saved in this browser. Use
          this space to explore the workflow with sample information.
        </span>
      </div>
      <div className="module-tabs" role="group" aria-label="Action status">
        {["Open", "High priority", "Overdue", "Completed", "Archived"].map(
          (f) => (
            <button
              className={filter === f ? "active" : ""}
              key={f}
              onClick={() => changeFilter(f)}
            >
              {f}
              {f === "Open" && (
                <span>
                  {actions.filter((a) => !a.archived && !a.done).length}
                </span>
              )}
            </button>
          ),
        )}
      </div>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find an action..."
        />
        <div className="toolbar-right">
          <select
            aria-label="Sort actions"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="due">Due date</option>
            <option value="title">Title A–Z</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              exportCSV("notara-sample-actions.csv", [
                ["Sample data only"],
                ["Title", "Property", "Tenant", "Due", "Priority", "Completed"],
                ...rows.map((a) => [
                  a.title,
                  a.property,
                  a.tenant,
                  a.due,
                  a.priority,
                  a.done,
                ]),
              ]);
              toast("Sample action export downloaded.");
            }}
          >
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>
      <div className="panel full-action-list">
        <CardHeading title={`${filter} actions`}>
          <Badge>{rows.length} actions</Badge>
        </CardHeading>
        {rows.map((a) => (
          <div className="full-action-row" key={a.id}>
            <ActionRow action={a} />
            <span className="full-action-date">{a.due}</span>
            <Button variant="ghost" size="sm" onClick={() => openCapture(a)}>
              Edit
            </Button>
            {!a.archived && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => archiveAction(a.id)}
              >
                Archive
              </Button>
            )}
          </div>
        ))}
        {!rows.length && (
          <div className="empty-state">
            <Check size={30} />
            <h2>A little breathing room.</h2>
            <p>No actions match this view.</p>
            <Button onClick={() => openCapture()}>
              <Plus size={15} />
              Capture an action
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
function CalendarPage() {
  const [selected, setSelected] = useState(17);
  const [month, setMonth] = useState(9);
  const { showDetail, openCapture } = useWorkspace();
  const title = new Date(2026, month, 1).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
  const days = new Date(2026, month + 1, 0).getDate();
  const offset = (new Date(2026, month, 1).getDay() + 6) % 7;
  const events = month === 9 && selected === 17 ? meetings : [];
  return (
    <>
      <div className="module-callout">
        <CalendarDays size={17} />
        <span>
          Sample calendar · Google Calendar is disconnected. Times are shown in
          Africa/Johannesburg (SAST).
        </span>
        <Link className="text-link" href="/settings">
          Set up <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="calendar-layout">
        <div className="panel calendar-panel">
          <div className="card-heading">
            <h2>{title}</h2>
            <div className="inline-buttons">
              <button
                className="icon-button"
                aria-label="Previous month"
                onClick={() => {
                  setMonth((m) => m - 1);
                  setSelected(1);
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMonth(9);
                  setSelected(17);
                }}
              >
                Preview day
              </Button>
              <button
                className="icon-button"
                aria-label="Next month"
                onClick={() => {
                  setMonth((m) => m + 1);
                  setSelected(1);
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="calendar-weekdays">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: offset }, (_, i) => (
              <span className="calendar-blank" key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => (
              <button
                key={i}
                className={`${selected === i + 1 ? "selected" : ""} ${month === 9 && i + 1 === 17 ? "has-events" : ""}`}
                onClick={() => setSelected(i + 1)}
              >
                <span>{i + 1}</span>
                {month === 9 && i + 1 === 17 && (
                  <small>
                    <i />
                    <i />
                    <i />
                  </small>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="panel calendar-agenda">
          <CardHeading title={`${selected} ${title}`} />
          <div className="calendar-event-list">
            {events.length ? (
              events.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    showDetail({
                      title: m.title,
                      kind: "Sample event · No live calendar connection",
                      content: (
                        <div className="record-detail">
                          <Badge color={m.color}>{m.type}</Badge>
                          <p>
                            {m.time}–{m.end} SAST · {m.property}
                          </p>
                          <SourceLink module="meetings">
                            Open meeting workspace
                          </SourceLink>
                          <Button onClick={() => openCapture()}>
                            Capture preparation action
                          </Button>
                        </div>
                      ),
                    })
                  }
                >
                  <span className={`dot ${m.color}`} />
                  <span>
                    <small>
                      {m.time} – {m.end}
                    </small>
                    <strong>{m.title}</strong>
                    <small>{m.property}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))
            ) : (
              <div className="empty-state">
                <CalendarDays size={29} />
                <p>No sample meetings on this day.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMonth(9);
                    setSelected(17);
                  }}
                >
                  View 17 October
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
function MeetingsPage() {
  const [inspect, setInspect] = useState(false);
  const [file, setFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  return (
    <>
      <div className="two-column">
        <div className="panel feature-panel">
          <span className="empty-icon">
            <Mic size={27} />
          </span>
          <Badge color="purple">Meeting intelligence</Badge>
          <h2>
            Stay in the conversation.
            <br />
            Keep the important parts.
          </h2>
          <p>
            A dedicated home for recordings, transcripts, decisions and
            commitments, connected to your properties and tenants.
          </p>
          <div className="feature-chips">
            <Badge>120-minute target</Badge>
            <Badge>Source timestamps</Badge>
            <Badge>Approval before changes</Badge>
          </div>
          <Button variant="outline" onClick={() => setInspect(true)}>
            <Upload size={16} />
            Inspect a local audio file
          </Button>
          <small className="muted-note">
            File details only. Recording, secure upload and transcription are
            not connected.
          </small>
        </div>
        <div className="panel">
          <CardHeading
            title="Today’s conversations"
            href="/calendar"
            label="View calendar"
          />
          <div className="upcoming-meetings">
            {meetings.map((m) => (
              <div key={m.id}>
                <span className={`meeting-icon ${m.color}`}>
                  <AudioLines size={19} />
                </span>
                <span>
                  <strong>{m.title}</strong>
                  <small>
                    {m.time} · {m.property}
                  </small>
                </span>
                <Badge>Scheduled sample</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ModuleEmpty
        icon={<AudioLines size={30} />}
        title="A home for every useful conversation"
        text="No recordings have been uploaded. Secure storage, consent, retention settings and a transcription provider are required before processing audio."
      >
        <Link className="text-link" href="/settings">
          Review integration status <ArrowUpRight size={14} />
        </Link>
      </ModuleEmpty>
      <Dialog
        open={inspect}
        onOpenChange={setInspect}
        title="Inspect a local audio file"
        description="The file stays on your device. No upload, recording or transcription takes place."
      >
        <label className="upload-zone">
          <Upload size={28} />
          <strong>Choose an audio file</strong>
          <span>MP3, M4A, WAV or other supported audio</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f ? { name: f.name, size: f.size, type: f.type } : null);
            }}
          />
        </label>
        {file && (
          <dl className="file-metadata">
            <div>
              <dt>File</dt>
              <dd>{file.name}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{(file.size / 1024 / 1024).toFixed(2)} MB</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{file.type || "Unknown audio format"}</dd>
            </div>
          </dl>
        )}
        <p className="muted-note">
          The production flow will require recording consent, a private storage
          bucket, resumable uploads, retention rules and a durable transcription
          job.
        </p>
      </Dialog>
    </>
  );
}
function CommunicationsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(messages[0].id);
  const { openCapture, openAI } = useWorkspace();
  const rows = messages.filter((m) =>
    `${m.title} ${m.from} ${m.property}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const current = rows.find((m) => m.id === selected) || rows[0];
  return (
    <>
      <div className="module-callout">
        <Mail size={18} />
        <span>
          Gmail is disconnected. These conversations are sample content.
        </span>
        <Link className="text-link" href="/settings">
          Review setup <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="panel inbox-layout">
        <div className="inbox-list">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search conversations..."
          />
          {rows.map((m) => (
            <button
              key={m.id}
              className={current?.id === m.id ? "active" : ""}
              onClick={() => setSelected(m.id)}
            >
              <div>
                <Avatar initials={m.initials} color={m.color} small />
                <strong>{m.from}</strong>
                <time>{m.time}</time>
              </div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <Badge>{m.property}</Badge>
            </button>
          ))}
          {!rows.length && (
            <div className="empty-state">No sample conversations found.</div>
          )}
        </div>
        <div className="inbox-detail">
          {current ? (
            <>
              <Badge color="purple">Sample conversation</Badge>
              <h2>{current.title}</h2>
              <div className="detail-person">
                <Avatar initials={current.initials} color={current.color} />
                <div>
                  <strong>{current.from}</strong>
                  <small>
                    {current.tenant} · {current.time}
                  </small>
                </div>
              </div>
              <p>{current.text}</p>
              <p className="muted-note">
                Preview message · replies and sending are unavailable until
                Gmail is connected.
              </p>
              <div className="related-links">
                <SourceLink module="tenants">{current.tenant}</SourceLink>
                <SourceLink module="properties">{current.property}</SourceLink>
              </div>
              <div className="inline-buttons">
                <Button onClick={() => openCapture()}>
                  <Plus size={15} />
                  Capture follow-up
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    openAI(`Summarise the thread: ${current.title}`)
                  }
                >
                  <Sparkles size={15} />
                  Ask about this
                </Button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Choose a conversation to see its context.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
function FinancialsPage() {
  const [balance, setBalance] = useState("Debit");
  const [query, setQuery] = useState("");
  const record = useRecordDetails();
  const rows = tenants.filter(
    (t) =>
      (balance === "All balances" ||
        (balance === "Debit"
          ? t.balance > 0
          : balance === "Credit"
            ? t.balance < 0
            : t.balance === 0)) &&
      `${t.name} ${t.property}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="stats-grid three-stats">
        <Stat
          label="Gross debit exposure"
          value={money(portfolio.debit)}
          meta="Active properties · credits excluded"
          icon={<Wallet size={19} />}
          color="pink"
          href="/financials"
        />
        <Stat
          label="Credit balances"
          value={money(4500)}
          meta="Kept separate from debit exposure"
          icon={<Wallet size={19} />}
          color="blue"
          href="/financials"
        />
        <Stat
          label="Change since September"
          value="−11.1%"
          meta="R 8 250 reduction in gross debit"
          icon={<ArrowDownRight size={19} />}
          color="teal"
          href="/financials"
        />
      </div>
      <div className="two-column">
        <div className="panel">
          <CardHeading title="Exposure over time">
            <Badge>Sample snapshots</Badge>
          </CardHeading>
          <div className="chart-padding">
            <ExposureChart />
          </div>
          <div className="snapshot-values">
            {exposure.map((p) => (
              <span key={p.month}>
                <small>{p.month}</small>
                <strong>{money(p.debit * 1000)}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="panel financial-principle">
          <span className="empty-icon">
            <ShieldCheck size={27} />
          </span>
          <h2>The full picture, without netting.</h2>
          <p>
            Debit, credit and zero balances are kept separate. Your main KPI
            always shows gross debit exposure across active properties.
          </p>
          <Badge color="amber">Sample snapshot · 17 October 2026</Badge>
          <p className="muted-note">
            Dated debtor-report imports, validation, tenant matching and
            immutable monthly snapshots follow in the financial-data milestone.
          </p>
        </div>
      </div>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Find a tenant balance..."
        />
        <div className="toolbar-right">
          <select
            aria-label="Balance filter"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          >
            <option>Debit</option>
            <option>Credit</option>
            <option>Zero</option>
            <option>All balances</option>
          </select>
          <Button
            variant="outline"
            onClick={() =>
              exportCSV("notara-sample-balances.csv", [
                ["Sample snapshot", previewDate],
                ["Tenant", "Property", "Debit", "Credit", "Ageing"],
                ...rows.map((t) => [
                  t.name,
                  t.property,
                  Math.max(0, t.balance),
                  Math.max(0, -t.balance),
                  t.age,
                ]),
              ])
            }
          >
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>
      <div className="panel">
        <Table
          headers={[
            "Tenant",
            "Property",
            "Premises",
            "Ageing",
            "Debit",
            "Credit",
            "",
          ]}
        >
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <button
                  className="table-text-button"
                  onClick={() => record.tenant(t.id)}
                >
                  {t.name}
                </button>
              </td>
              <td>{t.property}</td>
              <td>{t.unit}</td>
              <td>
                <Badge color={t.balance > 0 ? "amber" : "muted"}>{t.age}</Badge>
              </td>
              <td className={t.balance > 0 ? "text-pink" : ""}>
                {money(Math.max(0, t.balance))}
              </td>
              <td>{money(Math.max(0, -t.balance))}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`View balance context for ${t.name}`}
                  onClick={() => record.tenant(t.id)}
                >
                  <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
        {!rows.length && (
          <div className="empty-state">No balances match this filter.</div>
        )}
      </div>
    </>
  );
}
function TurnoverPage() {
  const [status, setStatus] = useState("All returns");
  const { openCapture } = useWorkspace();
  const returns = [
    { tenant: tenants[0], state: "Received", value: 284500, previous: 259000 },
    { tenant: tenants[1], state: "Received", value: 168200, previous: 161000 },
    { tenant: tenants[2], state: "Outstanding", value: null, previous: 212000 },
  ];
  const rows = returns.filter(
    (r) => status === "All returns" || r.state === status,
  );
  return (
    <>
      <div className="stats-grid three-stats">
        <Stat
          label="Expected returns"
          value="3"
          meta="Sample reporting tenants · September 2026"
          icon={<Users size={18} />}
          href="/turnover"
        />
        <Stat
          label="Received"
          value="2"
          meta="66.7% completion"
          icon={<Check size={18} />}
          color="teal"
          href="/turnover"
        />
        <Stat
          label="Outstanding"
          value="1"
          meta="The Local Kitchen"
          icon={<Clock3 size={18} />}
          color="amber"
          href="/turnover"
        />
      </div>
      <div className="module-toolbar">
        <h2 className="toolbar-title">
          September 2026 <Badge>Sample period</Badge>
        </h2>
        <div className="toolbar-right">
          <select
            aria-label="Turnover return status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All returns</option>
            <option>Received</option>
            <option>Outstanding</option>
          </select>
          <Button
            variant="outline"
            onClick={() =>
              exportCSV("notara-sample-turnover.csv", [
                ["Sample data only", "September 2026"],
                ["Tenant", "Status", "Turnover", "Prior year"],
                ...rows.map((r) => [
                  r.tenant.name,
                  r.state,
                  r.value ?? "",
                  r.previous,
                ]),
              ])
            }
          >
            <Download size={15} />
            Export
          </Button>
        </div>
      </div>
      <div className="panel">
        <Table
          headers={[
            "Reporting tenant",
            "Property",
            "Return status",
            "September turnover",
            "Year-on-year",
            "Next step",
          ]}
        >
          {rows.map((r) => (
            <tr key={r.tenant.id}>
              <td>
                <span className="table-person">
                  <Avatar initials={r.tenant.initials} color={r.tenant.color} />
                  <strong>{r.tenant.name}</strong>
                </span>
              </td>
              <td>{r.tenant.property}</td>
              <td>
                <Badge color={r.state === "Received" ? "teal" : "amber"}>
                  {r.state}
                </Badge>
              </td>
              <td>{r.value ? money(r.value) : "Awaiting submission"}</td>
              <td>
                {r.value ? (
                  <span className="trend-good">
                    +{(((r.value - r.previous) / r.previous) * 100).toFixed(1)}%
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {r.value ? (
                  <Badge>Sample received</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCapture()}
                  >
                    Create follow-up
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <div className="module-callout">
        <CircleAlert size={18} />
        <span>
          Capture, bulk import, supporting documents and configured turnover
          rent calculations are planned for the turnover-data milestone. No live
          returns are stored.
        </span>
      </div>
    </>
  );
}
function LeasesPage() {
  const [tab, setTab] = useState("Expiring in 60 days");
  const record = useRecordDetails();
  const expiring = tenants.filter((t) => t.lease <= "2026-12-16");
  const vacancies = [
    { property: "The Houghton", premises: "G05", area: 84, use: "Retail" },
    { property: "The Houghton", premises: "204", area: 126, use: "Office" },
    { property: "Rosebank Quarter", premises: "103", area: 112, use: "Office" },
    { property: "Parkhurst Place", premises: "R06", area: 96, use: "Retail" },
  ];
  return (
    <>
      <div className="stats-grid three-stats">
        <Stat
          label="Occupied premises"
          value="50"
          meta="Across 3 active properties"
          icon={<Building2 size={18} />}
          color="blue"
          href="/leases"
        />
        <Stat
          label="Upcoming expiries"
          value="3"
          meta="Within the next 60 days"
          icon={<CalendarDays size={18} />}
          color="amber"
          href="/leases"
        />
        <Stat
          label="Vacant premises"
          value="4"
          meta="418 m² of opportunity"
          icon={<LayoutGrid size={18} />}
          color="purple"
          href="/leases"
        />
      </div>
      <div className="module-tabs" role="group" aria-label="Lease view">
        {["Expiring in 60 days", "All sample leases", "Vacancies"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="panel">
        {tab === "Vacancies" ? (
          <Table headers={["Property", "Premises", "Area", "Use", "Status"]}>
            {vacancies.map((v) => (
              <tr key={v.property + v.premises}>
                <td>{v.property}</td>
                <td>{v.premises}</td>
                <td>{v.area} m²</td>
                <td>{v.use}</td>
                <td>
                  <Badge color="purple">Available · sample</Badge>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table
            headers={[
              "Tenant",
              "Property",
              "Premises",
              "Expiry date",
              "Days remaining",
              "",
            ]}
          >
            {(tab === "All sample leases" ? tenants : expiring).map((t) => (
              <tr key={t.id}>
                <td>
                  <button
                    className="table-text-button"
                    onClick={() => record.tenant(t.id)}
                  >
                    {t.name}
                  </button>
                </td>
                <td>{t.property}</td>
                <td>{t.unit}</td>
                <td>{t.lease}</td>
                <td>
                  <Badge color={t.lease < "2026-11-17" ? "amber" : "muted"}>
                    {Math.round(
                      (Date.parse(t.lease) - Date.parse(previewDate)) /
                        86400000,
                    )}{" "}
                    days
                  </Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`View lease context for ${t.name}`}
                    onClick={() => record.tenant(t.id)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      <p className="muted-note">
        The sample tenant directory is a subset of the 50 occupied premises.
        Every figure shown here is preview content.
      </p>
    </>
  );
}
function DocumentsPage() {
  return (
    <>
      <div className="module-callout">
        <HardDrive size={18} />
        <span>
          Google Drive and private document storage are disconnected. No
          documents are stored in this preview.
        </span>
        <Link className="text-link" href="/settings">
          Review connections <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="document-collections">
        {[
          {
            title: "Property documents",
            text: "Leases, plans and property records",
            icon: Building2,
          },
          {
            title: "Management reports",
            text: "Portfolio reports with linked evidence",
            icon: FileText,
          },
          {
            title: "Meeting records",
            text: "Recordings, transcripts and decisions",
            icon: AudioLines,
          },
        ].map((c) => (
          <div className="panel document-collection" key={c.title}>
            <c.icon size={27} />
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <Badge>Awaiting private storage</Badge>
          </div>
        ))}
      </div>
      <ModuleEmpty
        icon={<FileText size={32} />}
        title="Everything in its proper place"
        text="Private uploads, signed access links, version history, retention controls and source-linked reports will be built after authentication and storage are verified."
      >
        <Link className="button button-outline" href="/settings">
          Review setup <ArrowUpRight size={15} />
        </Link>
      </ModuleEmpty>
    </>
  );
}
function AIPage() {
  const { openAI } = useWorkspace();
  return (
    <>
      <div className="ai-page-hero panel">
        <span className="ai-orb">
          <Sparkles size={35} />
        </span>
        <span className="eyebrow">YOUR PERSONAL INTELLIGENCE</span>
        <h2>Bring your world into focus.</h2>
        <p>
          Ask better questions. Connect the dots.
          <br />
          Move forward with context you can trust.
        </p>
        <Badge color="amber">AI providers disconnected</Badge>
      </div>
      <div className="ai-prompt-grid">
        {[
          {
            title: "Start the day with clarity",
            prompt: "What needs my attention today?",
            icon: Sparkles,
          },
          {
            title: "Understand your exposure",
            prompt: "Which active tenants need an arrears follow-up?",
            icon: Wallet,
          },
          {
            title: "Prepare for the conversation",
            prompt: "Help me prepare for my next tenant meeting.",
            icon: AudioLines,
          },
          {
            title: "See what is coming",
            prompt: "Which leases expire in the next 60 days?",
            icon: CalendarDays,
          },
        ].map((p) => (
          <button
            className="panel ai-prompt"
            key={p.title}
            onClick={() => openAI(p.prompt)}
          >
            <p.icon size={20} />
            <h3>{p.title}</h3>
            <p>{p.prompt}</p>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <div className="module-callout">
        <ShieldCheck size={20} />
        <span>
          <strong>Sources first. Your approval always.</strong> Every future AI
          finding must cite an authorised source record. Consequential changes
          are drafted for review and approval.
        </span>
      </div>
    </>
  );
}
const integrations = [
  {
    name: "Gmail",
    category: "Communications",
    icon: Mail,
    color: "pink",
    description:
      "Read authorised threads, capture context and prepare reply drafts.",
    requires:
      "Google OAuth client, Gmail scopes, encrypted refresh tokens and a verified callback.",
  },
  {
    name: "Google Calendar",
    category: "Your schedule",
    icon: CalendarDays,
    color: "blue",
    description: "Bring your meetings and preparation into one place.",
    requires:
      "Google OAuth authorisation, calendar scopes, timezone handling and durable incremental sync.",
  },
  {
    name: "Google Drive",
    category: "Documents",
    icon: HardDrive,
    color: "teal",
    description: "Connect the documents behind your property world.",
    requires:
      "Least-privilege Drive OAuth scopes, private file access and token encryption.",
  },
  {
    name: "OpenAI",
    category: "Intelligence",
    icon: Sparkles,
    color: "purple",
    description:
      "Grounded briefings, extraction and answers with source links.",
    requires:
      "A server-only OpenAI API key, authorised retrieval, usage limits and verified structured outputs.",
  },
  {
    name: "Anthropic Claude",
    category: "Intelligence",
    icon: Sparkles,
    color: "amber",
    description: "Thoughtful analysis for documents and complex conversations.",
    requires:
      "A server-only Anthropic API key, provider routing, source validation and explicit approval flows.",
  },
  {
    name: "Private storage & transcription",
    category: "Meeting intelligence",
    icon: AudioLines,
    color: "blue",
    description: "Recordings, transcripts and decisions with timestamps.",
    requires:
      "Authenticated private storage, signed uploads, consent, retention controls and durable processing jobs.",
  },
];
function SettingsPage() {
  const { preferences, updatePreferences, openCustomize, showDetail, toast } =
    useWorkspace();
  const [tab, setTab] = useState("Integrations");
  return (
    <>
      <div className="module-tabs" role="group" aria-label="Settings section">
        {["Integrations", "Preferences", "Privacy & access"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Integrations" && (
        <>
          <div className="module-callout">
            <Plug size={18} />
            <span>
              No live services are connected. A successful connection and sync
              will be verified before any integration is shown as active.
            </span>
          </div>
          <div className="integration-grid">
            {integrations.map((i) => (
              <div className="panel integration-card" key={i.name}>
                <div className="integration-top">
                  <span className={`integration-icon ${i.color}`}>
                    <i.icon size={23} />
                  </span>
                  <Badge>Disconnected</Badge>
                </div>
                <small className="eyebrow">{i.category}</small>
                <h2>{i.name}</h2>
                <p>{i.description}</p>
                <dl>
                  <div>
                    <dt>Last successful sync</dt>
                    <dd>Never</dd>
                  </div>
                  <div>
                    <dt>Connection state</dt>
                    <dd>Not configured</dd>
                  </div>
                  <div>
                    <dt>Sync errors</dt>
                    <dd>No sync attempted</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    showDetail({
                      title: `Set up ${i.name}`,
                      kind: "Connection is not implemented in this design milestone",
                      content: (
                        <div className="record-detail">
                          <div className="connection-note">
                            <span className="dot amber" />
                            <span>
                              <strong>Disconnected</strong>
                              <small>
                                No credentials or authorisation have been
                                configured.
                              </small>
                            </span>
                          </div>
                          <h4>Required for activation</h4>
                          <p>{i.requires}</p>
                          <p>
                            Connection and reconnect controls will run the
                            verified authorisation flow in the integrations
                            milestone. Never paste API keys into this preview.
                          </p>
                          <Badge>Last successful sync: never</Badge>
                        </div>
                      ),
                    })
                  }
                >
                  Setup requirements <ArrowUpRight size={14} />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "Preferences" && (
        <div className="panel preference-panel">
          <CardHeading title="A workspace that feels like yours" />
          <div className="preference-row">
            <span>
              <strong>Appearance</strong>
              <small>
                Midnight by default. A lighter view when you need it.
              </small>
            </span>
            <select
              aria-label="Appearance"
              value={preferences.light ? "light" : "dark"}
              onChange={(e) =>
                updatePreferences({ light: e.target.value === "light" })
              }
            >
              <option value="dark">Midnight</option>
              <option value="light">Daylight</option>
            </select>
          </div>
          <div className="preference-row">
            <span>
              <strong>Dashboard layout</strong>
              <small>Choose which cards you see and their order.</small>
            </span>
            <Button variant="outline" onClick={openCustomize}>
              <SlidersHorizontal size={15} />
              Customise
            </Button>
          </div>
          <div className="preference-row">
            <span>
              <strong>Sidebar</strong>
              <small>Keep navigation compact, or make room for labels.</small>
            </span>
            <Button
              variant="outline"
              onClick={() =>
                updatePreferences({ collapsed: !preferences.collapsed })
              }
            >
              {preferences.collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </Button>
          </div>
          <div className="preference-row">
            <span>
              <strong>Timezone</strong>
              <small>
                Calendar and preview dates use South African Standard Time.
              </small>
            </span>
            <Badge>Africa/Johannesburg · UTC+2</Badge>
          </div>
          <div className="preference-row">
            <span>
              <strong>Preview preferences</strong>
              <small>
                Stored only in this browser. No private records should be
                entered.
              </small>
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                updatePreferences({
                  light: false,
                  collapsed: false,
                  hidden: [],
                  widgets: [
                    "brief",
                    "metrics",
                    "agenda",
                    "portfolio",
                    "communications",
                  ],
                });
                toast("Preview layout and appearance reset.");
              }}
            >
              Reset preferences
            </Button>
          </div>
        </div>
      )}
      {tab === "Privacy & access" && (
        <div className="panel privacy-panel">
          <span className="empty-icon">
            <ShieldCheck size={32} />
          </span>
          <h2>Private by design. Verified before launch.</h2>
          <p>
            This is a sample-data design preview. Authentication, a production
            database and private document storage have not been provisioned.
          </p>
          <div className="privacy-checklist">
            {[
              "Invite-only personal authentication before real data is accepted",
              "Ownership-based row-level security and cross-owner relationship checks",
              "Private storage with short-lived signed links",
              "Encrypted integration tokens and server-only API keys",
              "Append-only audit events and approval-based AI changes",
              "Separate preview / production projects and tested backup restoration",
            ].map((text) => (
              <div key={text}>
                <ShieldCheck size={17} />
                <span>{text}</span>
                <Badge>Planned</Badge>
              </div>
            ))}
          </div>
          <p className="muted-note">
            Do not enter tenant details, confidential documents, credentials or
            recordings into this preview. The first persistent-data milestone
            has a security verification gate before launch.
          </p>
        </div>
      )}
    </>
  );
}
