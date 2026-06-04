import React, { useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { AdminUsers } from "./AdminUsers";
import { AdminGuides } from "./AdminGuides";
import { AdminPending } from "./AdminPending";
import { AdminExcursions } from "./AdminExcursions";
import { AdminBookings } from "./AdminBookings";
import "./AdminPanel.css";

const NAV = [
  { key: "users", label: "Пользователи" },
  { key: "guides", label: "Гиды" },
  { key: "pending", label: "Заявки гидов" },
  { key: "excursions", label: "Экскурсии" },
  { key: "bookings", label: "Бронирования" },
];

function sectionFromPath(pathname) {
  const rest = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  return NAV.some((n) => n.key === rest) ? rest : "users";
}

const SECTIONS = {
  users: AdminUsers,
  guides: AdminGuides,
  pending: AdminPending,
  excursions: AdminExcursions,
  bookings: AdminBookings,
};

const AccessScreen = ({ title, text, navigate }) => (
  <div className="adm-denied-screen">
    <div className="adm-denied-card">
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="adm-btn adm-btn--primary" onClick={() => navigate("/")}>На главную</button>
    </div>
  </div>
);

const AdminPanel = () => {
  const { token, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const section = sectionFromPath(location.pathname);

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/users", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading) {
    return <div className="adm-denied-screen"><div className="adm-denied-card"><p>Загрузка админ-панели…</p></div></div>;
  }
  if (!token) {
    return <AccessScreen title="Требуется вход" text="Токен авторизации не найден. Войдите в систему." navigate={navigate} />;
  }
  if (!user || !user.is_superuser) {
    return <AccessScreen title="Доступ запрещён" text="У вас нет прав для доступа к админ-панели." navigate={navigate} />;
  }

  const SectionComponent = SECTIONS[section] || AdminUsers;

  return (
    <div className="adm-root">
      {/* ── Top bar ── */}
      <header className="adm-topbar">
        <div className="adm-brand">
          <span className="adm-brand-mark">Т</span>
          <span className="adm-brand-text">Путешествия · Админ</span>
        </div>
        <div className="adm-topbar-right">
          <span className="adm-user">{user.name || user.email}</span>
          <button className="adm-btn adm-btn--ghost" onClick={() => navigate("/")}>На сайт</button>
          <button className="adm-btn adm-btn--ghost" onClick={() => { logout(); navigate("/"); }}>Выйти</button>
        </div>
      </header>

      <div className="adm-body">
        {/* ── Sidebar ── */}
        <nav className="adm-sidebar">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`adm-nav-item${section === n.key ? " adm-nav-item--active" : ""}`}
              onClick={() => navigate(`/admin/${n.key}`)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="adm-content">
          <SectionComponent token={token} navigate={navigate} />
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
