import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Hello {user?.firstName}, pick a workflow to continue.</p>
        </div>
      </header>
      <div className="grid cards">
        <Link className="card tile" to="/parkings">
          <h3>Parkings</h3>
          <p className="muted">View availability, fees, and register new lots (admin).</p>
        </Link>
        <Link className="card tile" to="/sessions">
          <h3>Sessions</h3>
          <p className="muted">Record vehicle entry, print tickets, and process exits with bills.</p>
        </Link>
        <Link className="card tile" to="/reports">
          <h3>Reports</h3>
          <p className="muted">Outgoing revenue and entry volume between two timestamps.</p>
        </Link>
        {user?.role === "ADMIN" && (
          <Link className="card tile" to="/logs">
            <h3>Activity logs</h3>
            <p className="muted">Audit trail for security-sensitive actions.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
