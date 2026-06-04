
import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import HomePage from "./pages/HomePage/HomePage";
import SearchPage from "./pages/SearchPage/SearchPage";
import ExcursionDetailsPage from "./pages/ExcursionDetailsPage/ExcursionDetailsPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import BookingsPage from "./pages/BookingsPage/BookingsPage";
import GuideDashboard from "./pages/GuideDashboard/GuideDashboard";
import ExcursionForm from "./pages/ExcursionForm/ExcursionForm";
import GuideCalendar from "./pages/GuideCalendar/GuideCalendar";
import GuideSchedule from "./pages/GuideSchedule/GuideSchedule";
import GuidePage from "./pages/GuidePage/GuidePage";
import FavoritesPage from "./pages/FavoritesPage/FavoritesPage";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./AuthContext";
import { checkIfGuide } from "./api/userApi";

const AdminPanel = lazy(() => import("./pages/AdminPanel/AdminPanel"));

function GuideRoute({ children }) {
  const { token, user, loading } = useAuth();
  const [guideStatus, setGuideStatus] = useState("loading"); // loading | approved | pending | none

  useEffect(() => {
    if (loading) return;
    if (!token || !user) { setGuideStatus("none"); return; }
    if (!user.is_guide) { setGuideStatus("none"); return; }
    checkIfGuide(token)
      .then((res) => setGuideStatus(res.is_guide ? "approved" : "pending"))
      .catch(() => setGuideStatus("pending"));
  }, [token, user, loading]);

  if (loading || guideStatus === "loading") return null;
  if (!token) return <Navigate to="/" replace />;

  if (guideStatus === "none") {
    return (
      <div style={{ padding: "120px 40px", textAlign: "center", color: "#555", fontFamily: "Tinkoffsans, sans-serif" }}>
        <h2 style={{ marginBottom: 12, fontWeight: 700 }}>Доступ закрыт</h2>
        <p>Эта страница доступна только гидам. Подайте заявку в личном кабинете.</p>
      </div>
    );
  }

  if (guideStatus === "pending") {
    return (
      <div style={{ padding: "120px 40px", textAlign: "center", color: "#555", fontFamily: "Tinkoffsans, sans-serif" }}>
        <h2 style={{ marginBottom: 12, fontWeight: 700 }}>Заявка на рассмотрении</h2>
        <p style={{ maxWidth: 400, margin: "0 auto" }}>Ваша заявка на становление гидом отправлена и ожидает одобрения администратора. Мы уведомим вас, когда заявка будет рассмотрена.</p>
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
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/guides/:id" element={<GuidePage />} />
        <Route path="/guide/dashboard" element={<GuideRoute><GuideDashboard /></GuideRoute>} />
        <Route path="/guide/excursions/new" element={<GuideRoute><ExcursionForm /></GuideRoute>} />
        <Route path="/guide/excursions/:id/edit" element={<GuideRoute><ExcursionForm /></GuideRoute>} />
        <Route path="/guide/excursions/:id/schedule" element={<GuideRoute><GuideSchedule /></GuideRoute>} />
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
