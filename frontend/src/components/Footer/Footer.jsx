import React from 'react';
import './Footer.css';
import logo from '../../assets/logo.svg';

export default function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer__bottom">
        <div className="Footer__bottom-content">
          <div className="Footer__left">
            <div className="Footer__logo">
              <img className="Footer__logo" src={logo} alt="T-Путешествия" />
            </div>
            <div className="Footer__links">
              <a href="#" className="Footer__bottom-link">Правила сервиса</a>
              <a href="#" className="Footer__bottom-link">Обмен и возврат авиабилетов</a>
              <a href="#" className="Footer__bottom-link">Условия акций</a>
              <a href="#" className="Footer__bottom-link">В помощь туристам</a>
              <a href="#" className="Footer__bottom-link">Как получить кэшбэк от Путешествий</a>
              <a href="#" className="Footer__bottom-link">Условия рассрочки и кредита</a>
              <a href="#" className="Footer__bottom-link">Документы для партнеров</a>
            </div>
            <div className="Footer__legal-links">
              <a href="#" className="Footer__legal-link">Условия акции «Промокоды на покупку Авиабилетов»</a>
              <a href="#" className="Footer__legal-link">Условия проведения маркетинговых акций «Т-Путешествия»</a>
            </div>
            <div className="Footer__copyright">
              <span>© 2026 T-Travel. Все права защищены</span>
            </div>
          </div>
          <div className="Footer__right">
            <div className="Footer__phone">
              <div className="Footer__phone-main">8 800 700-11-66 или 999</div>
              <div className="Footer__phone-abroad">Из-за рубежа: 7 499 605-01-21</div>
            </div>
            <div className="Footer__social">
              <a href="#" className="Footer__social-icon" aria-label="Чат">💬</a>
              <a href="#" className="Footer__social-icon" aria-label="VKontakte">VK</a>
              <a href="#" className="Footer__social-icon" aria-label="Odnoklassniki">OK</a>
              <a href="#" className="Footer__social-icon" aria-label="Telegram">✈</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
