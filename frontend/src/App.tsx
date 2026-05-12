import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/Dashboard";
import { LoginPage } from "./pages/Login";
import { LogsPage } from "./pages/Logs";
import { ParkingsPage } from "./pages/Parkings";
import { RegisterPage } from "./pages/Register";
import { ReportsPage } from "./pages/Reports";
import { SessionsPage } from "./pages/Sessions";

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page center muted">
        <p>Loading session…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page center muted">
        <p>Loading session…</p>
      </div>
    );
  }
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page center muted">
        <p>Loading session…</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="parkings" element={<ParkingsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
