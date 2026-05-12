import { useEffect, useState } from "react";
import { apiFetch, type PaginatedMeta } from "../api";
import { PaginationBar } from "../components/PaginationBar";
import { useAuth } from "../auth";

type Parking = {
  id: string;
  code: string;
  name: string;
  totalSpaces: number;
  availableSpaces: number;
  location: string;
  feePerHour: number;
};

export function ParkingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [rows, setRows] = useState<Parking[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [totalSpaces, setTotalSpaces] = useState(10);
  const [location, setLocation] = useState("");
  const [feePerHour, setFeePerHour] = useState(500);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  async function load(p: number) {
    setError(null);
    const res = await apiFetch<{ success: boolean; data: Parking[]; meta: PaginatedMeta }>(
      `/parkings?page=${p}&limit=10`
    );
    setRows(res.data);
    setMeta(res.meta);
  }

  useEffect(() => {
    load(page).catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [page]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    try {
      await apiFetch("/parkings", {
        method: "POST",
        body: JSON.stringify({
          code,
          name,
          totalSpaces: Number(totalSpaces),
          location,
          feePerHour: Number(feePerHour),
        }),
      });
      setFormMsg("Parking registered.");
      setCode("");
      setName("");
      setLocation("");
      await load(page);
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Parkings</h1>
          <p className="muted">Attendants see availability and hourly fees. Admins can register new lots.</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      {isAdmin && (
        <section className="card section">
          <h2>Register parking</h2>
          <form className="form-row" onSubmit={onCreate}>
            <label className="field compact">
              <span>Code</span>
              <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="KG-01" />
            </label>
            <label className="field compact grow">
              <span>Name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field compact">
              <span>Spaces</span>
              <input
                required
                type="number"
                min={1}
                value={totalSpaces}
                onChange={(e) => setTotalSpaces(Number(e.target.value))}
              />
            </label>
            <label className="field compact grow">
              <span>Location</span>
              <input required value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label className="field compact">
              <span>Fee / hour</span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={feePerHour}
                onChange={(e) => setFeePerHour(Number(e.target.value))}
              />
            </label>
            <button className="btn primary" type="submit">
              Save
            </button>
          </form>
          {formMsg && <p className="muted small-top">{formMsg}</p>}
        </section>
      )}

      <section className="card section">
        <h2>Directory</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Available</th>
                <th>Total</th>
                <th>Fee / hr</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="mono">{p.code}</span>
                  </td>
                  <td>{p.name}</td>
                  <td>{p.availableSpaces}</td>
                  <td>{p.totalSpaces}</td>
                  <td>{p.feePerHour}</td>
                  <td className="muted">{p.location}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted center">
                    No parkings yet.
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
