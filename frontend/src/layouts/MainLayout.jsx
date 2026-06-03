import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showBack = location.pathname !== "/";

  return (
    <>
      <Header />
      {showBack && (
        <button className="btn-back btn-back--fixed" onClick={() => navigate(-1)}>
          ← Назад
        </button>
      )}
      <div className="App__content">
        <Outlet />
      </div>
      <Footer />
    </>
  );
};

export default MainLayout;
