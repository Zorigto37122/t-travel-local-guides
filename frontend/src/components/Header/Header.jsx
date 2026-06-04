import logo from "../../assets/images/logo.svg";
import lk_logo from "../../assets/images/lk_logo.svg";
import { Link, useNavigate } from "react-router-dom";
import SignForm from "../SignForm/SignForm";
import { useState, useEffect, useRef } from "react";
import "./Header.css";

import { useAuth } from "../../AuthContext.jsx";
import { checkIfGuide } from "../../api/userApi";

export default function Header({ showBack = false }) {
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
        {showBack && (
          <button className="Header__back-btn" onClick={() => navigate(-1)} aria-label="Назад">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd"/>
            </svg>
            <span className="Header__back-label">Назад</span>
          </button>
        )}
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

                <Link
                  to="/favorites"
                  className="Header__dropdown-item"
                  onClick={() => setShowMenu(false)}
                >
                  Избранное
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
