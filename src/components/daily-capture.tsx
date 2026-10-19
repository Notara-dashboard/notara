"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, RecordList } from "./record-list";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import type { RecordRow } from "@/lib/domain";
export function DailyCapture() {
  const [properties, setProperties] = useState<RecordRow[]>([]),
    [capture, setCapture] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api("/api/records/properties?filter-category=active&sort=name", {
      signal: c.signal,
    })
      .then((r) => setProperties(r.data))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, []);
  return (
    <section className="panel live-panel">
      <h2>Capture your day</h2>
      <div className="live-toolbar">
        {[
          ["meetings", "Meeting notes"],
          ["actions", "Action list"],
          ["general_notes", "General note"],
          ["security_reports", "Weekly security report"],
        ].map(([table, label]) => (
          <Button
            key={table}
            variant="outline"
            onClick={() => setCapture(table)}
          >
            {label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => window.print()}>
          Print dashboard / PDF
        </Button>
      </div>
      <h3>Your active buildings</h3>
      {error && <p role="alert">{error}</p>}
      <div className="live-toolbar">
        {properties.map((p) => (
          <Link className="badge" key={p.id} href="/properties">
            {p.name}
          </Link>
        ))}
      </div>
      <p className="muted-note">
        Source documents and dated portfolio records are available under
        Documents & Reports. Imported history retains its source date; check the
        latest position before acting.
      </p>
      <Dialog
        open={!!capture}
        onOpenChange={(open) => {
          if (!open) setCapture("");
        }}
        title="Daily capture"
        wide
        description="Create a record or update an existing one."
      >
        {capture && <RecordList table={capture} />}
      </Dialog>
    </section>
  );
}
