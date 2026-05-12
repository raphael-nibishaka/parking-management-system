import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  "nav-link" + (isActive ? " nav-link-active" : "");

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">XWZ</div>
          <div>
            <div className="brand-title">Parking</div>
            <div className="brand-sub">Kigali operations</div>
          </div>
        </div>
        <nav className="side-nav">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/parkings" className={linkClass}>
            Parkings
          </NavLink>
          <NavLink to="/sessions" className={linkClass}>
            Sessions
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/logs" className={linkClass}>
              Activity logs
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="user-meta">{user?.email}</div>
            <span className="role-pill">{user?.role === "ADMIN" ? "Admin" : "Attendant"}</span>
          </div>
          <button
            type="button"
            className="btn secondary full"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
