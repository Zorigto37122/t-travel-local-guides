import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";
import iconVK from "../../assets/vk_logo.svg";
import iconTelegram from "../../assets/tg_logo.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="Footer">
      <div className="Footer__container">
        <div className="Footer__section Footer__section--brand">
          <Link to="/" className="Footer__logo-link">
            <img src={logo} alt="Т-Путешествия" className="Footer__logo" />
            <div className="Footer__brand-text">
              <p className="Footer__title">Т-Путешествия</p>
              <p className="Footer__subtitle">Авторские Экскурсии</p>
            </div>
          </Link>
        </div>

        <div className="Footer__section Footer__section--contact">
          <h4 className="Footer__heading">Связь с нами</h4>
          <a
            href="tel:+78888888888"
            className="Footer__contact-link Footer__contact-link--phone"
          >
            8 888 888-88-88
          </a>
          <a
            href="mailto:support@ttravel.com"
            className="Footer__contact-link Footer__contact-link--email"
          >
            support@ttravel.com
          </a>
        </div>
      </div>

      <div className="Footer__bottom-bar">
        <p>© {currentYear} T-Travel. Все права защищены.</p>

        <div className="Footer__social-links">
          <a
            href="https://vk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="Footer__social-link"
          >
            <img src={iconVK} alt="ВКонтакте" />
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="Footer__social-link"
          >
            <img src={iconTelegram} alt="Telegram" />
          </a>
        </div>
      </div>
    </footer>
  );
}
