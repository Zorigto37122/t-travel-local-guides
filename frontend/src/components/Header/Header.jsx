import logo from '../../assets/logo.svg';
import lk_logo from '../../assets/lk_logo.svg';
import Button from '../Button/Button';
import SignForm from '../SingForm/SignForm';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../../AuthContext.jsx';

export default function Header() {
  const [signFormActivity, setSignFormActivity] = useState(false);
  const { user, logout } = useAuth();

  function openSignForm() {
    setSignFormActivity(true);
  }

  const handleLogout = () => {
    logout();
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
          <div className="Header__LKLink">
            <span>{user.name}</span>
            <img className="Header__logo" src={lk_logo} alt="Личный кабинет" />
            <Button className="Header__LogoutButton" onClick={handleLogout}>
              Выйти
            </Button>
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