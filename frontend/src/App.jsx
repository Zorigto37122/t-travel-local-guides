
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import "./App.css";
import SearchPage from "./components/SearchPage/SearchPage";
import HomePage from "./components/HomePage/HomePage";
import ExcursionDetailsPage from "./components/ExcursionDetails/ExcursionDetailsPage";
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
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
