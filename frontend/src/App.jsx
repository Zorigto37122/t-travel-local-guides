
import { lazy, Suspense } from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ExcursionDetailsPage from "./pages/ExcursionDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import BookingsPage from "./pages/BookingsPage";
import GuideDashboard from "./pages/GuideDashboard";
import ExcursionForm from "./pages/ExcursionForm";
import GuideCalendar from "./pages/GuideCalendar";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./AuthContext";

const AdminPanel = lazy(() => import("./pages/AdminPanel/AdminPanel"));

function GuideRoute({ children }) {
  const { token, user, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/" replace />;
  if (user && !user.is_guide) {
    return (
      <div style={{ padding: "120px 40px", textAlign: "center", color: "#555" }}>
        <h2 style={{ marginBottom: 12 }}>Доступ закрыт</h2>
        <p>Эта страница доступна только гидам. Подайте заявку в личном кабинете.</p>
      </div>
    );
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/excursions/:id" element={<ExcursionDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/guide/dashboard" element={<GuideRoute><GuideDashboard /></GuideRoute>} />
        <Route path="/guide/excursions/new" element={<GuideRoute><ExcursionForm /></GuideRoute>} />
        <Route path="/guide/excursions/:id/edit" element={<GuideRoute><ExcursionForm /></GuideRoute>} />
        <Route path="/guide/calendar" element={<GuideRoute><GuideCalendar /></GuideRoute>} />
      </Route>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Загрузка админ-панели...</div>}>
            <AdminPanel />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
