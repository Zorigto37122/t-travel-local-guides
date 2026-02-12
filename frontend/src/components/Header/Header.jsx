import logo from '../../assets/logo.svg';
import lk_logo from '../../assets/lk_logo.svg';
import Button from '../Button/Button';
import SignForm from '../SingForm/SignForm';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../../AuthContext.jsx';

export default function Header() {
  const [signFormActivity, setSignFormActivity] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  function openSignForm() {
    setSignFormActivity(true);
  }

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate('/');
  };

  return (
    <header className="Header">
      <nav className="Header__nav">
        <Link to="/" className="Header__logo-link">
          <img className="Header__logo" src={logo} alt="T-Путешествия" />
        </Link>
        <ul className="Header__nav-list">
          <li className="Header__nav-item">Частным лицам</li>
          <li className="Header__nav-item">Бизнесу</li>
          <li className="Header__nav-item">Премиум</li>
          <li className="Header__nav-item">Еще</li>
        </ul>
        {user ? (
          <div className="Header__user-menu" ref={menuRef}>
            <button 
              className="Header__LKLink Header__LKLink--user" 
              onClick={() => setShowMenu(!showMenu)}
            >
              <span>{user.name}</span>
              <img className="Header__logo" src={lk_logo} alt="Личный кабинет" />
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
          <button className="Header__LKLink" onClick={openSignForm}>
            <span>Личный кабинет</span>
            <img className="Header__logo" src={lk_logo} alt="Личный кабинет" />
          </button>
        )}
      </nav>
      <SignForm open={signFormActivity} toClose={setSignFormActivity}>
        вход в личный кабинет
      </SignForm>
    </header>
  );
}