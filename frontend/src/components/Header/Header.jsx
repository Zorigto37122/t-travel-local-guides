import logo from "../../assets/logo.svg";
import lk_logo from "../../assets/lk_logo.svg";
import { Link, useNavigate } from "react-router-dom";
import SignForm from "../SingForm/SignForm";
import { useState, useEffect, useRef } from "react";
import "./Header.css";

import { useAuth } from "../../AuthContext.jsx";
import { checkIfGuide } from "../../api";

export default function Header() {
  const [signFormActivity, setSignFormActivity] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isGuide, setIsGuide] = useState(false);

  const { user, logout, token } = useAuth();
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      checkIfGuide(token)
        .then((res) => setIsGuide(res.is_guide || false))
        .catch(() => setIsGuide(false));
    } else {
      setIsGuide(false);
    }
  }, [user, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const openSignForm = () => {
    setSignFormActivity(true);
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate("/");
  };

  return (
    <header className="Header">
      <nav className="Header__nav">
        <Link to="/" className="Header__brand-link">
          <img className="Header__logo" src={logo} alt="Т-Путешествия" />
          <h2 className="Header_title">Т-Путешествия</h2>
        </Link>

        {user ? (
          <div className="Header__user-menu" ref={menuRef}>
            <button
              className="Header__LKLink Header__LKLink--user"
              onClick={() => setShowMenu(!showMenu)}
            >
              <span>{user.name}</span>
              <img src={lk_logo} alt="Личный кабинет" />
            </button>

            {showMenu && (
              <div className="Header__dropdown-menu">
                <Link
                  to="/profile"
                  className="Header__dropdown-item"
                  onClick={() => setShowMenu(false)}
                >
                  Редактировать профиль
                </Link>

                <Link
                  to="/bookings"
                  className="Header__dropdown-item"
                  onClick={() => setShowMenu(false)}
                >
                  Мои бронирования
                </Link>

                {isGuide && (
                  <>
                    <Link
                      to="/guide/dashboard"
                      className="Header__dropdown-item"
                      onClick={() => setShowMenu(false)}
                    >
                      Мои экскурсии
                    </Link>

                    <Link
                      to="/guide/calendar"
                      className="Header__dropdown-item"
                      onClick={() => setShowMenu(false)}
                    >
                      Календарь бронирований
                    </Link>
                  </>
                )}

                <button
                  className="Header__dropdown-item Header__dropdown-item--logout"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : (
          <a className="Header__LKLink" onClick={openSignForm}>
            <span>Личный кабинет</span>
            <img src={lk_logo} alt="Личный кабинет" />
          </a>
        )}
      </nav>

      <SignForm open={signFormActivity} toClose={setSignFormActivity}>
        вход в личный кабинет
      </SignForm>
    </header>
  );
}
