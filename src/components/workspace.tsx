"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  House,
  LayoutDashboard,
  ListTodo,
  Mail,
  Menu,
  Moon,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Users,
  Wallet,
  AudioLines,
  ChartNoAxesCombined,
  LogOut,
} from "lucide-react";
import { modules, type ModuleId } from "@/lib/data";
import { defaultPreferences, preferenceSchema } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
export const moduleIcons = {
  today: LayoutDashboard,
  properties: Building2,
  tenants: Users,
  actions: ListTodo,
  calendar: CalendarDays,
  meetings: AudioLines,
  notes: FileText,
  security: Building2,
  communications: Mail,
  turnover: ChartNoAxesCombined,
  financials: Wallet,
  leases: House,
  documents: FileText,
  ai: Sparkles,
  settings: Settings2,
};
export const hrefFor = (id: ModuleId) => (id === "today" ? "/" : `/${id}`);
type Preferences = ReturnType<typeof preferenceSchema.parse>;
type WorkspaceState = {
  preferences: Preferences;
  updatePreferences: (v: Partial<Preferences>) => Promise<void>;
  notice: (s: string) => void;
  email: string;
};
const Context = createContext<WorkspaceState | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace required");
  return value;
}
export function Logo() {
  return (
    <Link href="/" className="brand">
      <img src="/icon.svg" width="34" height="34" alt="" />
      <span>
        NOTARA<span className="brand-subtitle">YOUR WORLD. ORGANISED.</span>
      </span>
    </Link>
  );
}
export function Workspace({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const path = usePathname();
  const [preferences, setPreferences] = useState<Preferences>(
    preferenceSchema.parse(defaultPreferences),
  );
  const [mobile, setMobile] = useState(false),
    [command, setCommand] = useState(false),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    try {
      localStorage.removeItem("notara.preview.v1");
      localStorage.removeItem("notara.action-filter.v1");
    } catch {}
    const controller = new AbortController();
    fetch("/api/preferences", { signal: controller.signal })
      .then((r) => r.json())
      .then((v) => {
        const parsed = preferenceSchema.safeParse(v.data?.value);
        if (parsed.success) setPreferences(parsed.data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.light
      ? "light"
      : "dark";
  }, [preferences.light]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  async function updatePreferences(v: Partial<Preferences>) {
    const next = { ...preferences, ...v };
    try {
      const r = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!r.ok) throw new Error();
      setPreferences(next);
    } catch {
      setMessage("Preferences could not be saved. Please retry.");
    }
  }
  const active = modules.find((m) => hrefFor(m.id) === path) || modules[0];
  const navigation = (
    <nav aria-label="Workspace navigation">
      {["WORKSPACE", "PORTFOLIO", "INTELLIGENCE", "SETTINGS"].map((group) => (
        <div className="nav-group" key={group}>
          <div className="nav-label">{group}</div>
          {modules
            .filter((m) => m.group === group)
            .map((m) => {
              const Icon = moduleIcons[m.id];
              return (
                <Link
                  className={`nav-item ${path === hrefFor(m.id) ? "active" : ""}`}
                  aria-current={path === hrefFor(m.id) ? "page" : undefined}
                  href={hrefFor(m.id)}
                  key={m.id}
                  onClick={() => setMobile(false)}
                  title={m.label}
                >
                  <Icon size={18} />
                  <span>{m.short}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
  return (
    <Context.Provider
      value={{ preferences, updatePreferences, notice: setMessage, email }}
    >
      <div
        className={`workspace ${preferences.collapsed ? "is-collapsed" : ""}`}
      >
        <aside className="sidebar">
          <Logo />
          <button className="sidebar-search" onClick={() => setCommand(true)}>
            <Search size={16} />
            <span>Find a workspace</span>
            <kbd>⌘ K</kbd>
          </button>
          {navigation}
          <div className="sidebar-bottom">
            <p className="muted-note">Private · {email}</p>
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mode: "signout" }),
                });
                if (r.ok) location.assign("/login");
                else setMessage("Sign-out failed. Please retry.");
              }}
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="topbar-left">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobile(true)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </Button>
              <span>Workspace / {active.short}</span>
            </div>
            <div className="topbar-right">
              <time>
                {new Intl.DateTimeFormat("en-ZA", {
                  timeZone: "Africa/Johannesburg",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </time>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  preferences.light ? "Use dark theme" : "Use light theme"
                }
                onClick={() =>
                  void updatePreferences({ light: !preferences.light })
                }
              >
                {preferences.light ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search navigation"
                onClick={() => setCommand(true)}
              >
                <Search size={18} />
              </Button>
            </div>
          </header>
          <main id="main-content">{children}</main>
        </div>
      </div>
      <Dialog
        open={mobile}
        onOpenChange={setMobile}
        title="Your workspace"
        description="Choose an area"
      >
        {navigation}
        <p className="muted-note">{email}</p>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const response = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "signout" }),
              });
              if (!response.ok) throw new Error();
              location.assign("/login");
            } catch {
              setMessage("Sign-out failed. Please retry.");
            }
          }}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </Dialog>
      <Dialog
        open={command}
        onOpenChange={setCommand}
        title="Find a workspace"
        description="Search areas of Notara"
      >
        <label className="field-label">
          Search
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Properties, actions, documents…"
          />
        </label>
        <div className="command-results">
          {modules
            .filter((m) => m.label.toLowerCase().includes(query.toLowerCase()))
            .map((m) => (
              <Link
                className="nav-item"
                href={hrefFor(m.id)}
                key={m.id}
                onClick={() => setCommand(false)}
              >
                {m.label}
              </Link>
            ))}
        </div>
      </Dialog>
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
