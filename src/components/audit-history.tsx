"use client";
import { useEffect, useState } from "react";
import { api } from "./record-list";
import { Button } from "./ui/button";
type Audit = {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  changed_fields: string[];
  occurred_at: string;
};
export function AuditHistory() {
  const [rows, setRows] = useState<Audit[]>([]),
    [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api("/api/audit?page=" + page, { signal: c.signal })
      .then((v) => {
        setRows(v.data);
        setTotal(v.count);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [page]);
  return (
    <section className="panel live-panel">
      <h2>Audit history</h2>
      <p className="muted-note">
        Append-only history of record changes. Private content is kept out of
        this log.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>When (SAST)</th>
              <th>Record</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {new Intl.DateTimeFormat("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(r.occurred_at))}
                </td>
                <td>
                  {r.table_name}
                  <small className="record-notes">{r.record_id}</small>
                </td>
                <td>
                  {r.operation.toLowerCase()} ·{" "}
                  {r.changed_fields
                    .filter(
                      (f) =>
                        ![
                          "updated_at",
                          "version",
                          "owner_id",
                          "id",
                          "created_at",
                        ].includes(f),
                    )
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="live-pagination">
        <span>{total} changes</span>
        <Button
          variant="ghost"
          disabled={!page}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          disabled={(page + 1) * 50 >= total}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
