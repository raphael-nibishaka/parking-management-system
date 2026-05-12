import { useEffect, useState } from "react";
import { apiFetch, type PaginatedMeta } from "../api";
import { PaginationBar } from "../components/PaginationBar";

type SessionRow = {
  id: string;
  ticketNumber: string;
  plateNumber: string;
  entryAt: string;
  exitAt: string | null;
  chargedAmount: number;
  parking: { code: string; name: string; feePerHour: number };
};

export function SessionsPage() {
  const [active, setActive] = useState<SessionRow[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [page, setPage] = useState(1);
  const [plate, setPlate] = useState("");
  const [parkingCode, setParkingCode] = useState("");
  const [ticket, setTicket] = useState<unknown>(null);
  const [bill, setBill] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(p: number) {
    const res = await apiFetch<{ success: boolean; data: SessionRow[]; meta: PaginatedMeta }>(
      `/sessions/active?page=${p}&limit=10`
    );
    setActive(res.data);
    setMeta(res.meta);
  }

  useEffect(() => {
    load(page).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [page]);

  async function onEntry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setTicket(null);
    try {
      const res = await apiFetch<{ success: boolean; data: { ticket: unknown } }>("/sessions/entry", {
        method: "POST",
        body: JSON.stringify({ plateNumber: plate, parkingCode }),
      });
      setTicket(res.data.ticket);
      setPlate("");
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entry failed");
    } finally {
      setBusy(false);
    }
  }

  async function onExit(id: string) {
    setError(null);
    setBill(null);
    setBusy(true);
    try {
      const res = await apiFetch<{ success: boolean; data: { bill: unknown } }>(`/sessions/${id}/exit`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setBill(res.data.bill);
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Sessions</h1>
          <p className="muted">Register incoming vehicles and close sessions to print bills.</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="grid two">
        <section className="card section">
          <h2>Car entry</h2>
          <form className="form-grid" onSubmit={onEntry}>
            <label className="field">
              <span>Plate number</span>
              <input required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="RAA123A" />
            </label>
            <label className="field">
              <span>Parking code</span>
              <input required value={parkingCode} onChange={(e) => setParkingCode(e.target.value)} />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              Issue ticket
            </button>
          </form>
          {ticket && (
            <pre className="ticket-preview">{JSON.stringify(ticket, null, 2)}</pre>
          )}
        </section>

        <section className="card section">
          <h2>Latest bill</h2>
          {bill ? (
            <pre className="ticket-preview">{JSON.stringify(bill, null, 2)}</pre>
          ) : (
            <p className="muted">Process an exit from the table to generate a bill.</p>
          )}
        </section>
      </div>

      <section className="card section">
        <h2>Active vehicles</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Plate</th>
                <th>Parking</th>
                <th>Entry</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.ticketNumber}</td>
                  <td>{s.plateNumber}</td>
                  <td>
                    {s.parking.code} · {s.parking.name}
                  </td>
                  <td className="muted">{new Date(s.entryAt).toLocaleString()}</td>
                  <td className="right">
                    <button type="button" className="btn secondary" disabled={busy} onClick={() => onExit(s.id)}>
                      Exit & bill
                    </button>
                  </td>
                </tr>
              ))}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted center">
                    No active sessions.
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
