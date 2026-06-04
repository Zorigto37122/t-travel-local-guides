import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

const MainLayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showBack = location.pathname !== "/";

  return (
    <>
      <Header showBack={showBack} />
      <div className="App__content">
        <Outlet />
      </div>
      <Footer />
    </>
  );
};

export default MainLayout;
