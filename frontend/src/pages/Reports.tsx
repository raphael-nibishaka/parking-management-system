import { useState } from "react";
import { apiFetch, type PaginatedMeta } from "../api";
import { PaginationBar } from "../components/PaginationBar";

type SessionRow = {
  id: string;
  ticketNumber: string;
  plateNumber: string;
  entryAt: string;
  exitAt: string | null;
  chargedAmount: number;
  parking: { code: string; name: string };
};

function toIsoLocal(dt: string) {
  const d = new Date(dt);
  return d.toISOString();
}

export function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [outRows, setOutRows] = useState<SessionRow[]>([]);
  const [outMeta, setOutMeta] = useState<(PaginatedMeta & { totalChargedAmount?: number }) | null>(null);
  const [inRows, setInRows] = useState<SessionRow[]>([]);
  const [inMeta, setInMeta] = useState<PaginatedMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadOutgoing(p: number) {
    setError(null);
    const q = new URLSearchParams({
      from: toIsoLocal(from),
      to: toIsoLocal(to),
      page: String(p),
      limit: "10",
    });
    const res = await apiFetch<{
      success: boolean;
      data: SessionRow[];
      meta: PaginatedMeta & { totalChargedAmount?: number };
    }>(`/reports/outgoing?${q.toString()}`);
    setOutRows(res.data);
    setOutMeta(res.meta);
  }

  async function loadEntries(p: number) {
    setError(null);
    const q = new URLSearchParams({
      from: toIsoLocal(from),
      to: toIsoLocal(to),
      page: String(p),
      limit: "10",
    });
    const res = await apiFetch<{ success: boolean; data: SessionRow[]; meta: PaginatedMeta }>(
      `/reports/entries?${q.toString()}`
    );
    setInRows(res.data);
    setInMeta(res.meta);
  }

  async function run() {
    try {
      await Promise.all([loadOutgoing(1), loadEntries(1)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Filter by entry/exit window and paginate through results.</p>
        </div>
      </header>

      <section className="card section">
        <div className="form-row wrap">
          <label className="field compact">
            <span>From</span>
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field compact">
            <span>To</span>
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button type="button" className="btn primary" onClick={() => void run()}>
            Apply range
          </button>
        </div>
        {error && <div className="alert error small-top">{error}</div>}
      </section>

      <div className="grid two">
        <section className="card section">
          <div className="section-head">
            <h2>Outgoing (billed)</h2>
            {outMeta && (
              <span className="pill">
                Total charged: <strong>{outMeta.totalChargedAmount ?? 0}</strong> RWF
              </span>
            )}
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Exit</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {outRows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.plateNumber}</td>
                    <td className="muted">{s.exitAt ? new Date(s.exitAt).toLocaleString() : "—"}</td>
                    <td>{s.chargedAmount}</td>
                  </tr>
                ))}
                {outRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted center">
                      Run a query to see outgoing vehicles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {outMeta && (
            <PaginationBar
              meta={outMeta}
              onChange={(p) => {
                void loadOutgoing(p).catch((e) =>
                  setError(e instanceof Error ? e.message : "Failed")
                );
              }}
            />
          )}
        </section>

        <section className="card section">
          <h2>Entered vehicles</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Entry</th>
                  <th>Parking</th>
                </tr>
              </thead>
              <tbody>
                {inRows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.plateNumber}</td>
                    <td className="muted">{new Date(s.entryAt).toLocaleString()}</td>
                    <td>{s.parking.code}</td>
                  </tr>
                ))}
                {inRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted center">
                      Run a query to see entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {inMeta && (
            <PaginationBar
              meta={inMeta}
              onChange={(p) => {
                void loadEntries(p).catch((e) =>
                  setError(e instanceof Error ? e.message : "Failed")
                );
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
