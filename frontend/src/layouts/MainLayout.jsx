import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import "./MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  return (
    <div className="AppLayout">
      <Header />
      <main className="AppLayout__content">
        <div
          style={{
            position: "relative",
            padding: "20px 0",
            marginBottom: "20px",
            background: "#f0f0f0",
            border: "1px solid #ccc",
          }}
        >
          <h4 style={{ margin: "0 0 10px", color: "#555" }}>
            Тест навигации (будет удалено)
          </h4>
          <button onClick={() => navigate("/")} style={{ marginRight: "10px" }}>
            Главная (/)
          </button>
          <button
            onClick={() => navigate("/results")}
            style={{ marginRight: "10px" }}
          >
            Результаты (/results)
          </button>
          <button
            onClick={() => navigate("/excursion/123")}
            style={{ marginRight: "10px" }}
          >
            Экскурсия (/excursion/123)
          </button>
          <button
            onClick={() => navigate("/profile")}
            style={{ marginRight: "10px" }}
          >
            Профиль (/profile)
          </button>
          <button
            onClick={() => navigate("/404")}
            style={{ marginRight: "10px" }}
          >
            404 (/*)
          </button>
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
