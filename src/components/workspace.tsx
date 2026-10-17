"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  House,
  LayoutDashboard,
  ListTodo,
  Mail,
  Menu,
  Moon,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  modules,
  properties,
  tenants,
  meetings,
  messages,
  sampleActions,
  type Action,
  type ModuleId,
} from "@/lib/data";

export const moduleIcons = {
  today: LayoutDashboard,
  properties: Building2,
  tenants: Users,
  actions: ListTodo,
  calendar: CalendarDays,
  meetings: AudioLines,
  communications: Mail,
  turnover: ChartNoAxesCombined,
  financials: Wallet,
  leases: House,
  documents: FileText,
  ai: Sparkles,
  settings: Settings2,
};
export const hrefFor = (id: ModuleId) => (id === "today" ? "/" : `/${id}`);
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <svg
        width="32"
        height="35"
        viewBox="0 0 36 40"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={compact ? "nm-small" : "nm"}
            x1="0"
            y1="0"
            x2="36"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#b29aff" />
            <stop offset=".5" stopColor="#7b64ff" />
            <stop offset="1" stopColor="#3f58ff" />
          </linearGradient>
          <linearGradient
            id={compact ? "nb-small" : "nb"}
            x1="36"
            y1="0"
            x2="24"
            y2="26"
          >
            <stop stopColor="#48a8ff" />
            <stop offset="1" stopColor="#5355ff" />
          </linearGradient>
        </defs>
        <path
          d="M2 35V11L10 3Q12 1 14 3L33 25V36L26 39L10 20V28Z"
          fill={`url(#${compact ? "nm-small" : "nm"})`}
        />
        <path
          d="M25 13L35 2V27L27 36L25 31Z"
          fill={`url(#${compact ? "nb-small" : "nb"})`}
        />
        <path d="M2 11L10 15V28L2 35Z" fill="#a98aff" opacity=".6" />
      </svg>
      {!compact && (
        <span>
          NOTARA<span className="brand-subtitle">YOUR WORLD. ORGANISED.</span>
        </span>
      )}
    </span>
  );
}
type Widget = "brief" | "metrics" | "agenda" | "portfolio" | "communications";
export const widgetNames: Record<Widget, string> = {
  brief: "Daily intelligence",
  metrics: "At a glance",
  agenda: "Schedule & priorities",
  portfolio: "Portfolio & financials",
  communications: "Recent communications",
};
type Preferences = {
  collapsed: boolean;
  light: boolean;
  widgets: Widget[];
  hidden: Widget[];
};
const defaults: Preferences = {
  collapsed: false,
  light: false,
  widgets: ["brief", "metrics", "agenda", "portfolio", "communications"],
  hidden: [],
};
type Detail = { title: string; kind: string; content: ReactNode };
type WorkspaceState = {
  actions: Action[];
  preferences: Preferences;
  updatePreferences: (p: Partial<Preferences>) => void;
  saveAction: (a: Action) => void;
  openCapture: (action?: Action) => void;
  toggleAction: (id: string) => void;
  archiveAction: (id: string) => void;
  showDetail: (d: Detail) => void;
  openAI: (prompt?: string) => void;
  openCustomize: () => void;
  toast: (message: string) => void;
};
const Context = createContext<WorkspaceState | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace provider is required");
  return value;
}
function isAction(a: unknown): a is Action {
  if (!a || typeof a !== "object") return false;
  const r = a as Record<string, unknown>;
  return (
    ["id", "title", "property", "tenant", "due", "notes"].every(
      (k) => typeof r[k] === "string",
    ) &&
    ["High", "Medium", "Low"].includes(String(r.priority)) &&
    typeof r.done === "boolean" &&
    typeof r.archived === "boolean"
  );
}
export function Workspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>(sampleActions);
  const [preferences, setPreferences] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [capture, setCapture] = useState(false);
  const [editing, setEditing] = useState<Action | undefined>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [customize, setCustomize] = useState(false);
  const [ai, setAI] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiSubmitted, setAISubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("notara.preview.v1") || "null",
      );
      if (
        saved?.actions &&
        Array.isArray(saved.actions) &&
        saved.actions.every(isAction)
      )
        setActions(saved.actions);
      if (saved?.preferences) {
        const p = saved.preferences;
        const order = Array.isArray(p.widgets)
          ? (p.widgets.filter(
              (w: unknown) => typeof w === "string" && w in widgetNames,
            ) as Widget[])
          : defaults.widgets;
        setPreferences({
          collapsed: p.collapsed === true,
          light: p.light === true,
          widgets: Array.from(new Set([...order, ...defaults.widgets])),
          hidden: Array.isArray(p.hidden)
            ? p.hidden.filter(
                (w: unknown) => typeof w === "string" && w in widgetNames,
              )
            : [],
        });
      }
    } catch {
      /* Invalid or unavailable preview storage falls back to sample records. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        "notara.preview.v1",
        JSON.stringify({ actions, preferences }),
      );
    } catch {
      /* The in-memory preview remains available when storage is blocked. */
    }
    document.documentElement.dataset.theme = preferences.light
      ? "light"
      : "dark";
  }, [actions, preferences, loaded]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(timer);
  }, [notice]);
  const updatePreferences = useCallback(
    (p: Partial<Preferences>) => setPreferences((v) => ({ ...v, ...p })),
    [],
  );
  const openCapture = (action?: Action) => {
    setDetail(null);
    setEditing(action);
    setCapture(true);
  };
  const saveAction = (action: Action) => {
    setActions((v) =>
      v.some((a) => a.id === action.id)
        ? v.map((a) => (a.id === action.id ? action : a))
        : [...v, action],
    );
    setCapture(false);
    setNotice("Sample action saved to this browser.");
  };
  const openAI = (value = "") => {
    setPrompt(value);
    setAISubmitted(false);
    setAI(true);
  };
  const active = modules.find((m) => hrefFor(m.id) === pathname) || modules[0];
  const nav = (id: ModuleId) => {
    router.push(hrefFor(id));
    setMobile(false);
    setCommand(false);
  };
  const searchItems = [
    ...modules.map((m) => ({
      key: m.id,
      title: m.label,
      sub: "Go to module",
      id: m.id,
    })),
    ...properties.map((p) => ({
      key: p.id,
      title: p.name,
      sub: `Sample property · ${p.address}`,
      id: "properties" as ModuleId,
    })),
    ...tenants.map((t) => ({
      key: t.id,
      title: t.name,
      sub: `Sample tenant · ${t.property}`,
      id: "tenants" as ModuleId,
    })),
    ...actions
      .filter((a) => !a.archived)
      .map((a) => ({
        key: a.id,
        title: a.title,
        sub: `Sample action · ${a.property}`,
        id: "actions" as ModuleId,
      })),
  ].filter((item) =>
    `${item.title} ${item.sub}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Context.Provider
      value={{
        actions,
        preferences,
        updatePreferences,
        saveAction,
        openCapture,
        toggleAction: (id) =>
          setActions((v) =>
            v.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
          ),
        archiveAction: (id) => {
          setActions((v) =>
            v.map((a) => (a.id === id ? { ...a, archived: true } : a)),
          );
          setNotice(
            "Sample action archived. View it with the Archived filter.",
          );
        },
        showDetail: setDetail,
        openAI,
        openCustomize: () => setCustomize(true),
        toast: setNotice,
      }}
    >
      <div
        className={`workspace ${preferences.collapsed ? "is-collapsed" : ""}`}
      >
        <aside className="sidebar" aria-label="Main navigation">
          <Link href="/" className="brand-link" aria-label="Notara home">
            <Logo compact={preferences.collapsed} />
          </Link>
          <button className="workspace-switch" onClick={() => nav("settings")}>
            <span className="workspace-avatar">N</span>
            <span>
              <strong>Personal workspace</strong>
              <small>Private by design</small>
            </span>
            <ChevronDown size={14} />
          </button>
          <button
            className="sidebar-search"
            onClick={() => setCommand(true)}
            aria-label="Search workspace"
          >
            <Search size={16} />
            <span>Search anything...</span>
            <kbd>⌘ K</kbd>
          </button>
          <Navigation
            active={active.id}
            collapsed={preferences.collapsed}
            onNavigate={nav}
          />
          <div className="sidebar-bottom">
            <div className="private-note">
              <span className="status-dot" />
              <span>Your space. Your perspective.</span>
            </div>
            <button
              className="nav-item"
              onClick={() => nav("settings")}
              title="Settings & integrations"
            >
              <Settings2 size={18} />
              <span>Settings & integrations</span>
            </button>
            <button className="profile" onClick={() => nav("settings")}>
              <span className="profile-avatar">N</span>
              <span>
                <strong>Your workspace</strong>
                <small>Personal account preview</small>
              </span>
              <ChevronRight size={15} />
            </button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-button desktop-only"
                onClick={() =>
                  updatePreferences({ collapsed: !preferences.collapsed })
                }
                aria-label={
                  preferences.collapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <PanelLeftClose size={18} />
              </button>
              <button
                className="icon-button mobile-menu"
                onClick={() => setMobile(true)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <span className="breadcrumb">
                Workspace <ChevronRight size={13} />{" "}
                <strong>{active.short}</strong>
              </span>
            </div>
            <div className="topbar-right">
              <span className="top-date">Saturday, 17 October 2026</span>
              <span className="header-divider" />
              <button
                className="icon-button"
                onClick={() => setCommand(true)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                className="icon-button theme-switch"
                onClick={() => updatePreferences({ light: !preferences.light })}
                aria-label={
                  preferences.light ? "Use dark theme" : "Use light theme"
                }
              >
                {preferences.light ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                className="icon-button notification-button"
                onClick={() => setNotifications(true)}
                aria-label="View sample notifications"
              >
                <Bell size={18} />
                <i />
              </button>
              <button
                className="top-avatar"
                onClick={() => nav("settings")}
                aria-label="Account settings"
              >
                N
              </button>
            </div>
          </header>
          <main id="main-content">
            <div className="preview-strip">
              <span>
                <span className="preview-dot" /> DESIGN PREVIEW{" "}
                <span className="preview-extra">
                  · Sample data. Your live workspace comes next.
                </span>
              </span>
              <Link href="/settings">
                Setup status <ArrowUpRight size={12} />
              </Link>
            </div>
            {children}
            <footer className="page-footer">
              <span>
                <Logo compact /> Your day. Your properties. Your intelligence.
              </span>
              <span>NOTARA · PERSONAL INTELLIGENCE</span>
            </footer>
          </main>
        </div>
        <nav className="mobile-bottom" aria-label="Mobile navigation">
          {(["today", "calendar", "ai", "properties"] as ModuleId[]).map(
            (id) => {
              const Icon = moduleIcons[id];
              return (
                <button
                  key={id}
                  className={`${active.id === id ? "active" : ""} ${id === "ai" ? "mobile-ai" : ""}`}
                  onClick={() => (id === "ai" ? openAI() : nav(id))}
                >
                  <Icon size={20} />
                  <span>
                    {id === "ai"
                      ? "Ask Notara"
                      : modules.find((m) => m.id === id)?.short}
                  </span>
                </button>
              );
            },
          )}
          <button onClick={() => setMobile(true)}>
            <Menu size={20} />
            <span>More</span>
          </button>
        </nav>
        <button className="ask-floating" onClick={() => openAI()}>
          <Sparkles size={17} />
          <span>Ask Notara</span>
          <kbd>AI</kbd>
        </button>
      </div>
      <Dialog open={mobile} onOpenChange={setMobile} title="Your workspace">
        <Navigation
          active={active.id}
          collapsed={false}
          onNavigate={nav}
          includeSettings
        />
      </Dialog>
      <Dialog
        open={command}
        onOpenChange={setCommand}
        title="Find your focus"
        description="Search modules, sample properties, tenants and actions."
        wide
      >
        <div className="command-input">
          <Search size={20} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your workspace..."
            aria-label="Search workspace"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-results">
          {searchItems.length ? (
            searchItems.map((item) => (
              <button key={item.key} onClick={() => nav(item.id)}>
                <span className="search-result-icon">
                  <Search size={16} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.sub}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))
          ) : (
            <div className="empty-state">
              No results for “{query}”. Try a module or property name.
            </div>
          )}
        </div>
        <div className="dialog-footnote">
          Tip: press Ctrl K or ⌘ K from anywhere.
        </div>
      </Dialog>
      <Dialog
        open={notifications}
        onOpenChange={setNotifications}
        title="Your attention, thoughtfully directed"
        description="Sample notifications · 17 October 2026"
      >
        <div className="notification-list">
          {[
            {
              title: "A payment needs a follow-up",
              text: "Artisan Coffee Co. · R 32 500 outstanding",
              module: "financials" as ModuleId,
              color: "pink",
            },
            {
              title: "A renewal is coming up",
              text: "Studio Collective · expires in 26 days",
              module: "leases" as ModuleId,
              color: "amber",
            },
            {
              title: "September returns are outstanding",
              text: "The Local Kitchen · one sample return pending",
              module: "turnover" as ModuleId,
              color: "blue",
            },
          ].map((n) => (
            <button
              key={n.title}
              onClick={() => {
                nav(n.module);
                setNotifications(false);
              }}
            >
              <span className={`dot ${n.color}`} />
              <span>
                <strong>{n.title}</strong>
                <small>{n.text}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </Dialog>
      <Dialog
        open={capture}
        onOpenChange={setCapture}
        title={editing ? "Edit action" : "A clear next step"}
        description="Sample action · Saved only in this browser. Do not enter private tenant information."
      >
        <ActionForm
          key={editing?.id || "new"}
          action={editing}
          onSave={saveAction}
          onCancel={() => setCapture(false)}
        />
      </Dialog>
      <Dialog
        open={!!detail}
        onOpenChange={(value) => {
          if (!value) setDetail(null);
        }}
        title={detail?.title || "Record"}
        description={detail?.kind || "Sample record"}
      >
        {detail?.content}
      </Dialog>
      <Dialog
        open={customize}
        onOpenChange={setCustomize}
        title="Your day, your way"
        description="Choose your dashboard cards and put them in the order that works for you."
      >
        <div className="customize-list">
          {preferences.widgets.map((w, index) => (
            <div key={w}>
              <label>
                <input
                  type="checkbox"
                  checked={!preferences.hidden.includes(w)}
                  onChange={() =>
                    updatePreferences({
                      hidden: preferences.hidden.includes(w)
                        ? preferences.hidden.filter((h) => h !== w)
                        : [...preferences.hidden, w],
                    })
                  }
                />
                <span>{widgetNames[w]}</span>
              </label>
              <button
                className="icon-button"
                disabled={index === 0}
                aria-label={`Move ${widgetNames[w]} up`}
                onClick={() => {
                  const order = [...preferences.widgets];
                  [order[index - 1], order[index]] = [
                    order[index],
                    order[index - 1],
                  ];
                  updatePreferences({ widgets: order });
                }}
              >
                <ArrowUp size={16} />
              </button>
              <button
                className="icon-button"
                disabled={index === preferences.widgets.length - 1}
                aria-label={`Move ${widgetNames[w]} down`}
                onClick={() => {
                  const order = [...preferences.widgets];
                  [order[index + 1], order[index]] = [
                    order[index],
                    order[index + 1],
                  ];
                  updatePreferences({ widgets: order });
                }}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <Button
            variant="outline"
            onClick={() =>
              updatePreferences({ widgets: defaults.widgets, hidden: [] })
            }
          >
            Reset layout
          </Button>
          <Button onClick={() => setCustomize(false)}>
            Done <Check size={15} />
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={ai}
        onOpenChange={setAI}
        title="Ask Notara"
        description="Your intelligence, grounded in your world."
      >
        <div className="ai-dialog-intro">
          <span className="ai-orb">
            <Sparkles size={29} />
          </span>
          <h3>A little context changes everything.</h3>
          <p>
            Once connected, Notara will help you understand your portfolio,
            prepare for meetings and turn information into action.
          </p>
        </div>
        <div className="connection-note">
          <span className="dot amber" />
          <span>
            <strong>AI is not connected</strong>
            <small>
              No prompt is sent. OpenAI and Anthropic credentials have not been
              configured.
            </small>
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAISubmitted(true);
          }}
        >
          <label className="field-label" htmlFor="ai-prompt">
            Explore a question
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What needs my attention today?"
            required
            rows={3}
          />
          <Button className="w-full" type="submit">
            <Sparkles size={16} />
            Check connection
          </Button>
        </form>
        {aiSubmitted && (
          <p className="inline-feedback" role="status">
            A live AI provider and authorised data sources are required before
            Notara can answer. Open Settings & integrations to review setup.
          </p>
        )}
        <Link
          className="text-link center-link"
          href="/settings"
          onClick={() => setAI(false)}
        >
          Review integrations <ArrowUpRight size={14} />
        </Link>
      </Dialog>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
function Navigation({
  active,
  collapsed,
  onNavigate,
  includeSettings = false,
}: {
  active: ModuleId;
  collapsed: boolean;
  onNavigate: (id: ModuleId) => void;
  includeSettings?: boolean;
}) {
  const { actions } = useWorkspace();
  const count = actions.filter((a) => !a.done && !a.archived).length;
  return (
    <div className="navigation">
      {[
        "WORKSPACE",
        "PORTFOLIO",
        "INTELLIGENCE",
        ...(includeSettings ? ["SETTINGS"] : []),
      ].map((group) => (
        <div className="nav-group" key={group}>
          <div className="nav-label">{collapsed ? "—" : group}</div>
          {modules
            .filter((m) => m.group === group)
            .map((m) => {
              const Icon = moduleIcons[m.id];
              return (
                <Link
                  key={m.id}
                  href={hrefFor(m.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(m.id);
                  }}
                  className={`nav-item ${active === m.id ? "active" : ""}`}
                  aria-current={active === m.id ? "page" : undefined}
                  title={m.label}
                >
                  <Icon size={18} />
                  <span>{m.short}</span>
                  {m.id === "actions" && (
                    <span className="nav-count">{count}</span>
                  )}
                  {m.id === "ai" && <span className="mini-ai">AI</span>}
                </Link>
              );
            })}
        </div>
      ))}
    </div>
  );
}
function ActionForm({
  action,
  onSave,
  onCancel,
}: {
  action?: Action;
  onSave: (a: Action) => void;
  onCancel: () => void;
}) {
  const [selectedProperty, setSelectedProperty] = useState(
    action?.property || "",
  );
  const [selectedTenant, setSelectedTenant] = useState(action?.tenant || "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        const title = String(values.get("title")).trim();
        if (!title) return;
        onSave({
          id: action?.id || crypto.randomUUID(),
          title,
          property: String(values.get("property")),
          tenant: String(values.get("tenant") || ""),
          due: String(values.get("due")),
          priority: values.get("priority") as Action["priority"],
          notes: String(values.get("notes") || ""),
          done: action?.done || false,
          archived: action?.archived || false,
        });
      }}
      className="record-form"
    >
      <label>
        What needs to happen?
        <input
          name="title"
          defaultValue={action?.title}
          required
          maxLength={160}
          placeholder="e.g. Review the Rosebank renewal"
        />
      </label>
      <div className="form-grid">
        <label>
          Property
          <select
            name="property"
            value={selectedProperty}
            onChange={(e) => {
              setSelectedProperty(e.target.value);
              setSelectedTenant("");
            }}
          >
            <option value="">No property</option>
            {properties.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Tenant
          <select
            name="tenant"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            disabled={!selectedProperty}
          >
            <option value="">No tenant</option>
            {tenants
              .filter((t) => t.property === selectedProperty)
              .map((t) => (
                <option key={t.id}>{t.name}</option>
              ))}
          </select>
        </label>
        <label>
          Due date
          <input
            name="due"
            type="date"
            defaultValue={action?.due || "2026-10-17"}
            required
          />
        </label>
        <label>
          Priority
          <select name="priority" defaultValue={action?.priority || "Medium"}>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea
          name="notes"
          rows={3}
          defaultValue={action?.notes}
          placeholder="Add a little context..."
          maxLength={2000}
        />
      </label>
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Plus size={16} />
          {action ? "Save changes" : "Create sample action"}
        </Button>
      </div>
    </form>
  );
}
