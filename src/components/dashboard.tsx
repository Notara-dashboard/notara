"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileClock,
  ListTodo,
  Mail,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActionRow,
  Avatar,
  Badge,
  CardHeading,
  SourceLink,
  Stat,
  useRecordDetails,
} from "@/components/shared";
import { useWorkspace } from "@/components/workspace";
import {
  activeProperties,
  meetings,
  messages,
  money,
  portfolio,
} from "@/lib/data";
const ExposureChart = dynamic(() => import("@/components/exposure-chart"), {
  ssr: false,
  loading: () => (
    <div className="exposure-chart chart-loading">Loading exposure chart…</div>
  ),
});
export function Dashboard() {
  const {
    actions,
    preferences,
    openCapture,
    openCustomize,
    openAI,
    showDetail,
  } = useWorkspace();
  const records = useRecordDetails();
  const openActions = actions.filter((a) => !a.done && !a.archived);
  const high = openActions.filter((a) => a.priority === "High").length;
  const widgets = {
    brief: (
      <section className="brief-grid" key="brief">
        <div className="brief-card">
          <div className="brief-top">
            <span className="eyebrow">
              <Sparkles size={15} /> YOUR DAILY INTELLIGENCE
            </span>
            <Badge color="purple">Sample brief</Badge>
          </div>
          <h2>A clear view. A confident start.</h2>
          <p>
            You have <Link href="/calendar">3 meetings</Link> on your agenda. A
            rental follow-up and a lease renewal need your attention. Your
            active portfolio is <Link href="/properties">92.6% occupied</Link> —
            let’s keep things moving.
          </p>
          <div className="brief-insights">
            <Link href="/financials">
              <span className="insight-icon pink">
                <Wallet size={15} />
              </span>
              <span>
                <strong>One payment to prioritise</strong>
                <small>Artisan Coffee Co. · {money(32500)}</small>
              </span>
              <ArrowUpRight size={15} />
            </Link>
            <Link href="/leases">
              <span className="insight-icon amber">
                <FileClock size={15} />
              </span>
              <span>
                <strong>A renewal on the horizon</strong>
                <small>Studio Collective · 26 days remaining</small>
              </span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="brief-footer">
            <span>
              <span className="tiny-spark">✧</span> Curated sample · 3 linked
              sources
            </span>
            <button
              onClick={() =>
                showDetail({
                  title: "Today’s sample briefing",
                  kind: "Hand-authored design preview · No AI generation",
                  content: (
                    <div className="record-detail">
                      <p>
                        These findings are written from the sample records
                        shipped with this design preview. They are not a live AI
                        output.
                      </p>
                      <h4>Sources</h4>
                      <SourceLink module="calendar">
                        3 sample meetings · 17 October 2026
                      </SourceLink>
                      <SourceLink module="financials">
                        Artisan Coffee Co. · R 32 500 debit
                      </SourceLink>
                      <SourceLink module="leases">
                        Studio Collective · expires 12 November 2026
                      </SourceLink>
                      <h4>Next steps</h4>
                      <p>
                        Confirm the payment follow-up, review renewal terms and
                        prepare for your scheduled portfolio catch-up. No
                        changes have been made to any record.
                      </p>
                    </div>
                  ),
                })
              }
            >
              Read full brief <ArrowRight size={14} />
            </button>
          </div>
          <div className="brief-decoration" aria-hidden="true">
            ✧
          </div>
        </div>
        <div className="focus-card">
          <div className="focus-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="focus-core">
              <Sparkles size={28} />
            </span>
            <i className="orbit-star star-one">✦</i>
            <i className="orbit-star star-two">✧</i>
          </div>
          <span className="eyebrow">A LITTLE LESS NOISE</span>
          <h2>More room to think.</h2>
          <p>
            Your properties, priorities and next steps.
            <br />
            All connected. All in one place.
          </p>
          <button onClick={() => openAI("What should I focus on today?")}>
            Think it through with Notara <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
    ),
    metrics: (
      <section className="stats-grid" key="metrics" aria-label="At a glance">
        <Stat
          label="Open actions"
          value={openActions.length}
          icon={<ListTodo size={19} />}
          color="purple"
          href="/actions"
          meta={
            <>
              <span className="dot pink" />
              {high} high priority <span className="stat-separator">·</span>{" "}
              {openActions.filter((a) => a.due < "2026-10-17").length} overdue
            </>
          }
        />
        <Stat
          label="Gross debit arrears"
          value={money(portfolio.debit)}
          icon={<Wallet size={19} />}
          color="pink"
          href="/financials"
          meta={
            <>
              <span className="trend-good">
                <ArrowDownRight size={13} />
                11.1%
              </span>{" "}
              vs. September
            </>
          }
        />
        <Stat
          label="Lease expiries"
          value="3"
          icon={<FileClock size={19} />}
          color="amber"
          href="/leases"
          meta={
            <>
              <span className="dot amber" />
              Within the next 60 days
            </>
          }
        />
        <Stat
          label="Turnover outstanding"
          value="1"
          icon={<TrendingUp size={19} />}
          color="teal"
          href="/turnover"
          meta={
            <>
              <span className="dot teal" />
              September return to collect
            </>
          }
        />
      </section>
    ),
    agenda: (
      <section className="two-column agenda-grid" key="agenda">
        <div className="panel agenda-panel">
          <CardHeading
            title="Your day ahead"
            icon={<CalendarDays size={17} />}
            href="/calendar"
            label="Open calendar"
          />
          <div className="agenda-date">
            <span>SATURDAY, 17 OCTOBER</span>
            <Badge>{meetings.length} meetings</Badge>
          </div>
          <div className="timeline">
            {meetings.map((m, i) => (
              <button
                className="meeting-row"
                key={m.id}
                onClick={() =>
                  showDetail({
                    title: m.title,
                    kind: "Sample calendar event · Not synced with Google Calendar",
                    content: (
                      <div className="record-detail">
                        <Badge color={m.color}>{m.type}</Badge>
                        <dl>
                          <div>
                            <dt>When</dt>
                            <dd>
                              17 Oct 2026 · {m.time}–{m.end} SAST
                            </dd>
                          </div>
                          <div>
                            <dt>Property</dt>
                            <dd>{m.property}</dd>
                          </div>
                          <div>
                            <dt>Attendees</dt>
                            <dd>{m.attendees.join(", ")} · sample initials</dd>
                          </div>
                        </dl>
                        <p className="muted-note">
                          Calendar sync, invitations and joining links will be
                          available after Google authorisation.
                        </p>
                        <SourceLink module="meetings">
                          Prepare in Meeting Intelligence
                        </SourceLink>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => openCapture()}
                        >
                          Capture a preparation action
                        </Button>
                      </div>
                    ),
                  })
                }
              >
                <span className="meeting-time">
                  {m.time}
                  <small>{m.end}</small>
                </span>
                <span className={`timeline-line ${m.color}`} />
                <span className="meeting-info">
                  <strong>{m.title}</strong>
                  <small>{m.property}</small>
                  <span className="meeting-type">
                    {i === 2 ? (
                      <Building2 size={11} />
                    ) : (
                      <AudioLines size={11} />
                    )}
                    {m.type}
                  </span>
                </span>
                <span className="attendee-stack">
                  {m.attendees.slice(0, 2).map((a, ai) => (
                    <Avatar
                      key={a}
                      initials={a}
                      color={ai ? "blue" : "purple"}
                      small
                    />
                  ))}
                  {m.attendees.length > 2 && (
                    <span className="extra-attendee">+1</span>
                  )}
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="agenda-bottom">
            <Clock3 size={13} />
            <span>Space to focus between 11:45 and 14:30</span>
            <span className="muted">SAST</span>
          </div>
        </div>
        <div className="panel priority-panel">
          <CardHeading
            title="What needs your attention"
            icon={<CircleAlert size={17} />}
            href="/actions"
          />
          <div className="priority-summary">
            <span>
              <span className="dot pink" />
              {high} high priority
            </span>
            <span>{openActions.length} open actions</span>
          </div>
          <div className="action-list">
            {openActions.slice(0, 4).map((a) => (
              <ActionRow key={a.id} action={a} />
            ))}
            {openActions.length === 0 && (
              <div className="empty-state">
                <Check size={25} />
                <p>You’re all caught up.</p>
              </div>
            )}
          </div>
          <button className="capture-link" onClick={() => openCapture()}>
            <Plus size={16} />
            Capture an action<span>Keep it out of your head.</span>
          </button>
        </div>
      </section>
    ),
    portfolio: (
      <section className="two-column portfolio-grid" key="portfolio">
        <div className="panel portfolio-panel">
          <CardHeading
            title="Your portfolio, at a glance"
            icon={<Building2 size={17} />}
            href="/properties"
          />
          <div className="portfolio-overview">
            <div>
              <strong>
                {portfolio.properties}
                <span>properties</span>
              </strong>
              <small>Active in your dashboard</small>
            </div>
            <div className="occupancy-ring">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="20" />
                <circle cx="24" cy="24" r="20" strokeDasharray="116.4 125.66" />
              </svg>
              <span>
                92.6<small>%</small>
              </span>
            </div>
            <div className="occupancy-text">
              <strong>Looking well occupied</strong>
              <small>
                {portfolio.occupied} of {portfolio.units} premises occupied
              </small>
              <Link href="/leases">
                4 vacancies to explore <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
          <div className="property-mini-list">
            {activeProperties.map((p) => (
              <button key={p.id} onClick={() => records.property(p.id)}>
                <img src={p.image} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.type} <i />
                    {p.units} premises
                  </small>
                </span>
                <span className="property-occupancy">
                  {Math.round((p.occupied / p.units) * 100)}%
                  <small>occupied</small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="panel exposure-panel">
          <CardHeading
            title="Arrears in perspective"
            icon={<Wallet size={17} />}
            href="/financials"
            label="View financials"
          />
          <div className="exposure-summary">
            <div>
              <span>GROSS DEBIT EXPOSURE</span>
              <strong>{money(portfolio.debit)}</strong>
            </div>
            <Badge color="teal">
              <ArrowDownRight size={12} />
              11.1% this month
            </Badge>
          </div>
          <ExposureChart />
          <div className="chart-foot">
            <span>
              <span className="dot purple" />
              Active portfolio · sample trend
            </span>
            <span>Credits excluded</span>
          </div>
        </div>
      </section>
    ),
    communications: (
      <section className="panel communications-panel" key="communications">
        <CardHeading
          title="Conversations worth a look"
          icon={<Mail size={17} />}
          href="/communications"
          label="All communications"
        />
        <div className="communication-grid">
          {messages.map((m) => (
            <button
              className="communication-card"
              key={m.id}
              onClick={() =>
                showDetail({
                  title: m.title,
                  kind: "Sample communication · Not imported from Gmail",
                  content: (
                    <div className="record-detail">
                      <div className="detail-person">
                        <Avatar initials={m.initials} color={m.color} />
                        <div>
                          <strong>{m.from}</strong>
                          <small>
                            {m.tenant} · {m.time}
                          </small>
                        </div>
                      </div>
                      <p>{m.text}</p>
                      <SourceLink module="tenants">{m.tenant}</SourceLink>
                      <SourceLink module="properties">{m.property}</SourceLink>
                      <Button className="w-full" onClick={() => openCapture()}>
                        <Plus size={15} />
                        Capture a follow-up
                      </Button>
                    </div>
                  ),
                })
              }
            >
              <div>
                <Avatar initials={m.initials} color={m.color} small />
                <strong>{m.from}</strong>
                <time>{m.time}</time>
              </div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <span className="message-property">
                <Building2 size={11} />
                {m.property}
                <ArrowUpRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>
    ),
  };
  return (
    <div className="page-content dashboard">
      <div className="page-heading">
        <div>
          <span className="greeting-kicker">
            <Sun size={14} /> A FRESH PERSPECTIVE, EVERY DAY
          </span>
          <h1>
            Good morning<span className="heading-dot">.</span>
          </h1>
          <p>Here’s your world, brought together.</p>
        </div>
        <div className="heading-actions">
          <Button
            variant="outline"
            onClick={openCustomize}
            aria-label="Customise dashboard"
          >
            <SlidersHorizontal size={15} />
            <span>Customise</span>
          </Button>
          <Button onClick={() => openCapture()}>
            <Plus size={17} />
            New action
          </Button>
        </div>
      </div>
      <div className="dashboard-widgets">
        {preferences.widgets
          .filter((w) => !preferences.hidden.includes(w))
          .map((w) => widgets[w])}
        {preferences.hidden.length === preferences.widgets.length && (
          <div className="empty-state panel">
            <SlidersHorizontal size={30} />
            <h2>A little space to start fresh.</h2>
            <p>Add cards to shape your day.</p>
            <Button onClick={openCustomize}>Customise dashboard</Button>
          </div>
        )}
      </div>
      <button className="dashboard-customise" onClick={openCustomize}>
        <SlidersHorizontal size={13} />
        Make this space yours. Customise your dashboard.
      </button>
    </div>
  );
}
