import logo from "../../assets/logo.svg";
import lk_logo from "../../assets/lk_logo.svg";
import { Link } from "react-router-dom";
import SignForm from "../SingForm/SignForm";
import { useState } from "react";
import "./Header.css";
export default function Header() {
  const [SignFormActivity, SetSignFormActivity] = useState(false);

  function openSignForm() {
    console.log("click");
    SetSignFormActivity(true);
  }

  return (
    <header className="Header">
      <nav className="Header__nav">
        <Link to={"/"} className="Header__brand-link">
          <img className="Header__logo" src={logo}></img>
          <h2 className="Header_title">Т-Путешествия</h2>
          {/* <ul className="Header__nav-list">
          <li className="Header__nav-item">Частным лицам</li>
          <li className="Header__nav-item">Бизнесу</li>
          <li className="Header__nav-item">Премиум</li>
          <li className="Header__nav-item">Еще</li>
        </ul> */}
        </Link>
        <a className="Header__LKLink" onClick={openSignForm}>
          <span>Личный кабинет</span>
          <img className="Header__logo" src={lk_logo}></img>
        </a>
      </nav>
      <SignForm open={SignFormActivity} toClose={SetSignFormActivity}>
        вход в личный кабинет
      </SignForm>
    </header>
  );
}
