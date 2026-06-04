import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.svg";
import iconVK from "../../assets/images/vk_logo.svg";
import iconTelegram from "../../assets/images/tg_logo.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="Footer">
      <div className="Footer__inner">

        <div className="Footer__top">
          {/* Brand */}
          <div className="Footer__brand">
            <Link to="/" className="Footer__logo-link">
              <img src={logo} alt="Т-Путешествия" className="Footer__logo" />
              <div className="Footer__brand-text">
                <span className="Footer__brand-name">Т-Путешествия</span>
                <span className="Footer__brand-sub">Авторские экскурсии</span>
              </div>
            </Link>
            <p className="Footer__brand-desc">
              Бронируйте авторские экскурсии от проверенных местных гидов —
              по России и всему миру
            </p>
            <div className="Footer__social">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="Footer__social-btn"
                title="ВКонтакте"
              >
                <img src={iconVK} alt="ВКонтакте" className="Footer__social-icon" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="Footer__social-btn"
                title="Telegram"
              >
                <img src={iconTelegram} alt="Telegram" className="Footer__social-icon" />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          <div className="Footer__nav-group">
            <div className="Footer__nav-col">
              <h4 className="Footer__nav-heading">Туристам</h4>
              <Link to="/search" className="Footer__nav-link">Найти экскурсию</Link>
              <Link to="/bookings" className="Footer__nav-link">Мои бронирования</Link>
              <Link to="/favorites" className="Footer__nav-link">Избранное</Link>
              <Link to="/profile" className="Footer__nav-link">Личный кабинет</Link>
            </div>

            <div className="Footer__nav-col">
              <h4 className="Footer__nav-heading">Гидам</h4>
              <Link to="/guide/dashboard" className="Footer__nav-link">Кабинет гида</Link>
              <Link to="/guide/excursions/new" className="Footer__nav-link">Создать экскурсию</Link>
              <Link to="/guide/excursions/new" className="Footer__nav-link">Расписание экскурсий</Link>
              <Link to="/guide/calendar" className="Footer__nav-link">Календарь бронирований</Link>
            </div>

            <div className="Footer__nav-col">
              <h4 className="Footer__nav-heading">О сервисе</h4>
              <a href="#" className="Footer__nav-link">Как это работает</a>
              <a href="#" className="Footer__nav-link">Стать гидом</a>
              <a href="#" className="Footer__nav-link">Правила сервиса</a>
              <a href="#" className="Footer__nav-link">Помощь</a>
            </div>
          </div>

          {/* Contacts */}
          <div className="Footer__contacts">
            <h4 className="Footer__nav-heading">Связь с нами</h4>
            <a href="tel:+78007001166" className="Footer__phone">
              8 800 700-11-66
            </a>
            <span className="Footer__phone-note">Бесплатно по России</span>
            <a href="mailto:support@t-travel.ru" className="Footer__email">
              support@t-travel.ru
            </a>
            <div className="Footer__features">
              <span className="Footer__feature-tag">Отзывы</span>
              <span className="Footer__feature-tag">Рейтинги гидов</span>
              <span className="Footer__feature-tag">Избранное</span>
              <span className="Footer__feature-tag">Безопасная оплата</span>
            </div>
          </div>
        </div>

        <div className="Footer__divider" />

        <div className="Footer__bottom">
          <p className="Footer__copyright">
            © 2006–{currentYear} Т-Путешествия. Все права защищены.
          </p>
          <div className="Footer__bottom-links">
            <a href="#" className="Footer__bottom-link">Политика конфиденциальности</a>
            <a href="#" className="Footer__bottom-link">Условия использования</a>
            <a href="#" className="Footer__bottom-link">Реквизиты</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
