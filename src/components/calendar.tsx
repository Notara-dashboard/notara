"use client";
import { useEffect, useState } from "react";
import { api } from "./record-list";
import { today, type RecordRow } from "@/lib/domain";
import { Button } from "./ui/button";
export function Calendar({ revision }: { revision: number }) {
  const [month, setMonth] = useState(today().slice(0, 7)),
    [selected, setSelected] = useState(today()),
    [events, setEvents] = useState<RecordRow[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [year, m] = month.split("-").map(Number),
    first = new Date(Date.UTC(year, m - 1, 1)),
    days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
    offset = (first.getUTCDay() + 6) % 7;
  const nextMonth = new Date(Date.UTC(year, m, 1)).toISOString().slice(0, 7);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    (async () => {
      const all: RecordRow[] = [];
      for (let p = 0; ; p++) {
        const v = await api(
          `/api/records/events?page=${p}&from=${encodeURIComponent(month + "-01T00:00:00+02:00")}&to=${encodeURIComponent(nextMonth + "-01T00:00:00+02:00")}`,
          { signal: c.signal },
        );
        all.push(...v.data);
        if (all.length >= v.count || !v.data.length) break;
      }
      setEvents(all);
      setError("");
    })()
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [month, nextMonth, revision]);
  const eventDate = (e: RecordRow) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Johannesburg",
    }).format(new Date(String(e.starts_at)));
  const shift = (step: number) => {
    const value = new Date(Date.UTC(year, m - 1 + step, 1))
      .toISOString()
      .slice(0, 7);
    setMonth(value);
    setSelected(value + "-01");
  };
  return (
    <section className="panel live-panel">
      <div className="card-heading">
        <h2>
          {new Intl.DateTimeFormat("en-ZA", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(first)}
        </h2>
        <div className="row-buttons">
          <Button
            variant="ghost"
            aria-label="Previous month"
            onClick={() => shift(-1)}
          >
            ←
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMonth(today().slice(0, 7));
              setSelected(today());
            }}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            aria-label="Next month"
            onClick={() => shift(1)}
          >
            →
          </Button>
        </div>
      </div>
      <p className="muted-note">
        Your Notara calendar · All times SAST. Google Calendar sync is not
        configured.
      </p>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading calendar…</p>}
      <div className="live-calendar" aria-label="Calendar month">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={"blank" + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = month + "-" + String(i + 1).padStart(2, "0");
          const count = events.filter((e) => eventDate(e) === date).length;
          return (
            <button
              className={selected === date ? "selected" : ""}
              key={date}
              aria-label={`${date}, ${count} events`}
              aria-pressed={selected === date}
              onClick={() => setSelected(date)}
            >
              <span>{i + 1}</span>
              {count > 0 && (
                <small>
                  {count}
                  <span className="calendar-event-word"> events</span>
                </small>
              )}
            </button>
          );
        })}
      </div>
      <h3 className="live-selected-day">{selected}</h3>
      {events
        .filter((e) => eventDate(e) === selected)
        .map((e) => (
          <div className="live-summary-row" key={e.id}>
            <strong>{e.name}</strong>
            <span>
              {new Intl.DateTimeFormat("en-ZA", {
                timeZone: "Africa/Johannesburg",
                timeStyle: "short",
              }).format(new Date(String(e.starts_at)))}{" "}
              –{" "}
              {new Intl.DateTimeFormat("en-ZA", {
                timeZone: "Africa/Johannesburg",
                timeStyle: "short",
              }).format(new Date(String(e.ends_at)))}
            </span>
          </div>
        ))}
      {!loading && !events.some((e) => eventDate(e) === selected) && (
        <p className="muted-note">No events on this day.</p>
      )}
    </section>
  );
}
