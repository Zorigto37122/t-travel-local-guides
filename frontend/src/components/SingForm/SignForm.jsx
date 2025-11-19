import { createPortal } from "react-dom";
import { useState } from "react";
import { PatternFormat } from "react-number-format";
import { useRef, useEffect } from "react";
import cross from "../../assets/cross.svg";
import "./SignForm.css";
import Button from "../Button/Button";

export default function SignForm({ children, open, toClose }) {
  const [formType, setFormType] = useState("login");

  const handleSwitch = (type) => {
    setFormType(type);
  };

  const dialogRef = useRef();

  useEffect(() => {
    if (open) {
      dialogRef.current.showModal();
      document.body.classList.add("overflow-y-hidden");
      console.log("opened");
    } else {
      dialogRef.current.close();
      document.body.classList.remove("overflow-y-hidden");
      console.log("closed");
    }
  }, [open]);

  return createPortal(
    <dialog ref={dialogRef} className={`SignForm SignForm--${formType}`}>
      <div className="SignForm__container">
        <div className="SignForm__switcher">
          <Button
            className={`SignForm__tab ${
              formType === "login" ? "SignForm__tab--active" : ""
            }`}
            onClick={() => handleSwitch("login")}
          >
            Вход
          </Button>
          <Button
            className={`SignForm__tab ${
              formType === "register" ? "SignForm__tab--active" : ""
            }`}
            onClick={() => handleSwitch("register")}
          >
            Регистрация
          </Button>
        </div>

        <div className="SignForm__content">
          {formType === "login" ? (
            <LoginForm toClose={toClose} />
          ) : (
            <RegisterForm toClose={toClose} />
          )}
        </div>

        <Button
          className="SignForm__close-button"
          onClick={() => toClose(false)}
        >
          <img src={cross}></img>
        </Button>
      </div>
    </dialog>,
    document.getElementById("modal")
  );
}

function RegisterForm({ toClose }) {
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const registerData = {
      name: name,
      surname: surname,
      phone: phone.replace(/[^\d]/g, ""),
      password: password,
    };
    console.log("Данные регистрации:", registerData);

    setName("");
    setSurname("");
    setPhone("");
    setPassword("");
    toClose(false);
  };

  return (
    <>
      <h3>Регистрация в Авторские Экскурсии</h3>
      <form className="InputForm RegisterForm" onSubmit={handleSubmit}>
        <input
          type="name"
          placeholder="Имя"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="surname"
          placeholder="Фамилия"
          required
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <PatternFormat
          format="+7 (###) ###-##-##"// 👈 Формат маски
          mask="_" // Символ-заполнитель
          value={phone}
          onValueChange={(values) => {
            setPhone(values.formattedValue);
          }}
          type="tel"
          placeholder="Телефон"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          minLength="8"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="SignForm__submit-button" type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </>
  );
}

function LoginForm({ toClose }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(phone, phone.length);
    const loginData = {
      phone: phone.replace(/[^\d]/g, ""),
      password: password,
    };
    console.log("Данные входа:", loginData);

    setPhone("");
    setPassword("");
    toClose(false);
  };

  return (
    <>
      <h3>Вход в Личный Кабинет</h3>
      <form className="InputForm LoginForm" onSubmit={handleSubmit}>
        <PatternFormat
          format="+7 (###) ###-##-##" // 👈 Формат маски
          mask="_" // Символ-заполнитель
          value={phone}
          onValueChange={(values) => {
            setPhone(values.formattedValue);
          }}
          type="tel"
          placeholder="Телефон"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          minLength="8"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="SignForm__submit-button" type="submit">
          Войти
        </Button>
      </form>
    </>
  );
}
