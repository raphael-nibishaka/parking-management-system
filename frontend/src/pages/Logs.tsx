import { useEffect, useState } from "react";
import { apiFetch, type PaginatedMeta } from "../api";
import { PaginationBar } from "../components/PaginationBar";

type LogRow = {
  id: string;
  action: string;
  details: unknown;
  ip: string | null;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string; role: string } | null;
};

export function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await apiFetch<{ success: boolean; data: LogRow[]; meta: PaginatedMeta }>(
          `/logs?page=${page}&limit=15`
        );
        setRows(res.data);
        setMeta(res.meta);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load logs");
      }
    })();
  }, [page]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Activity logs</h1>
          <p className="muted">Security-relevant events with request context.</p>
        </div>
      </header>
      {error && <div className="alert error">{error}</div>}
      <section className="card section">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>User</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    <span className="mono">{r.action}</span>
                  </td>
                  <td>{r.user ? `${r.user.firstName} ${r.user.lastName}` : "—"}</td>
                  <td className="muted">{r.ip ?? "—"}</td>
                  <td className="ellipsis">
                    <code>{r.details ? JSON.stringify(r.details) : "—"}</code>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="muted center">
                    No log entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && <PaginationBar meta={meta} onChange={(p) => setPage(p)} />}
      </section>
    </div>
  );
}
