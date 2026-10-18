"use client";
import { useEffect, useState } from "react";
import { api } from "./record-list";
import { Button } from "./ui/button";
import { money, today } from "@/lib/domain";
type Insights = {
  turnover_expected: number;
  turnover_received: number;
  turnover_missing: number;
  returns: {
    id: string;
    name: string;
    tenant: string;
    amount: number | null;
    previous_amount: number | null;
  }[];
  history: { as_of: string; debit: number; credit: number }[];
  vacancy_count: number;
  vacancies: {
    id: string;
    name: string;
    property: string;
    area: number | null;
  }[];
};
export function PortfolioInsights({
  kind,
}: {
  kind: "leases" | "turnover" | "financials";
}) {
  const [data, setData] = useState<Insights | null>(null),
    [period, setPeriod] = useState(today().slice(0, 7)),
    [error, setError] = useState(""),
    [rev, setRev] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api("/api/insights?period=" + period, { signal: controller.signal })
      .then((v) => {
        setData(v.data);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [period, rev]);
  return (
    <section className="panel live-panel">
      <div className="card-heading">
        <h2>
          {kind === "leases"
            ? "Current vacancies"
            : kind === "turnover"
              ? "Monthly reporting coverage"
              : "Finalised financial history"}
        </h2>
        <Button variant="ghost" onClick={() => setRev((v) => v + 1)}>
          Refresh summary
        </Button>
      </div>
      {kind === "turnover" && (
        <label>
          Reporting month
          <input
            type="month"
            value={period}
            onChange={(e) => {
              if (e.target.value) setPeriod(e.target.value);
            }}
          />
        </label>
      )}
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p role="status">Loading summary…</p>
      ) : kind === "leases" ? (
        <>
          <p>{data.vacancy_count} vacant premises in the active portfolio.</p>
          {data.vacancies.map((v) => (
            <div key={v.id} className="live-summary-row">
              <strong>{v.name}</strong>
              <span>{v.property}</span>
              <span>
                {v.area === null ? "Area not recorded" : `${v.area} m²`}
              </span>
            </div>
          ))}
          {data.vacancy_count > 100 && (
            <p className="muted-note">
              First 100 vacancies shown. Use Premises to search all records.
            </p>
          )}
        </>
      ) : kind === "turnover" ? (
        <>
          <div className="stats-grid">
            {[
              ["Expected", data.turnover_expected],
              ["Received", data.turnover_received],
              ["Missing", data.turnover_missing],
            ].map(([label, value]) => (
              <div className="stat-card" key={label}>
                <span>{label}</span>
                <strong className="stat-value">{value}</strong>
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Return</th>
                  <th>Same month last year</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {data.returns.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.tenant}
                      <small className="record-notes">{r.name}</small>
                    </td>
                    <td>
                      {r.amount === null ? "Missing" : money(Number(r.amount))}
                    </td>
                    <td>
                      {r.previous_amount === null
                        ? "No comparable return"
                        : money(Number(r.previous_amount))}
                    </td>
                    <td>
                      {r.amount === null ||
                      r.previous_amount === null ||
                      Number(r.previous_amount) === 0
                        ? "—"
                        : `${((Number(r.amount) / Number(r.previous_amount) - 1) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.turnover_expected === 0 && (
            <p className="muted-note">
              Add reporting requirements before tracking missing returns. A
              received zero is counted as a submission.
            </p>
          )}
        </>
      ) : data.history.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>As of</th>
                <th>Gross debit</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h) => (
                <tr key={h.as_of}>
                  <td>{h.as_of}</td>
                  <td>{money(Number(h.debit))}</td>
                  <td>{money(Number(h.credit))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted-note">
          No finalised snapshots. Create a draft, enter balances and finalise
          it. Credits never reduce gross debit.
        </p>
      )}
    </section>
  );
}
