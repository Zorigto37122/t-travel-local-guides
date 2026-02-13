
import { lazy, Suspense, useEffect } from "react";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import "./App.css";
import SearchPage from "./components/SearchPage/SearchPage";
import HomePage from "./components/HomePage/HomePage";
import ExcursionDetailsPage from "./components/ExcursionDetails/ExcursionDetailsPage";
import ProfilePage from "./components/ProfilePage/ProfilePage";
import BookingsPage from "./components/BookingsPage/BookingsPage";
import GuideDashboard from "./components/GuideDashboard/GuideDashboard";
import ExcursionForm from "./components/ExcursionForm/ExcursionForm";
import GuideCalendar from "./components/GuideCalendar/GuideCalendar";
import { Routes, Route, useLocation } from "react-router-dom";

// Ленивая загрузка AdminPanel для избежания ошибок при отсутствии react-admin
const AdminPanel = lazy(() => import("./components/AdminPanel/AdminPanel"));

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Прокручиваем страницу в начало при изменении маршрута
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!isAdminRoute && <Header />}
      <div className="App__content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/excursions/:id" element={<ExcursionDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/guide/dashboard" element={<GuideDashboard />} />
          <Route path="/guide/excursions/new" element={<ExcursionForm />} />
          <Route path="/guide/excursions/:id/edit" element={<ExcursionForm />} />
          <Route path="/guide/calendar" element={<GuideCalendar />} />
          <Route 
            path="/admin/*" 
            element={
              <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>Загрузка админ-панели...</div>}>
                <AdminPanel />
              </Suspense>
            } 
          />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
