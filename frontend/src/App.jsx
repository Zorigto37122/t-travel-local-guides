
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
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Header />
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
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
