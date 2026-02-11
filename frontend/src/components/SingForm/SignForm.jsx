import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { PatternFormat } from "react-number-format";
import cross from "../../assets/cross.svg";
import "./SignForm.css";
import Button from "../Button/Button";
import { useAuth } from "../../AuthContext.jsx";
import { loginUser, registerUser } from "../../api.js";

function normalizePhoneToE164(maskedPhone) {
  if (!maskedPhone) return null;
  const digits = maskedPhone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("7")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export default function SignForm({ open, toClose }) {
  const [formType, setFormType] = useState("login");

  const handleSwitch = (type) => {
    setFormType(type);
  };

  const dialogRef = useRef();

  useEffect(() => {
    if (open) {
      dialogRef.current.showModal();
      document.body.classList.add("overflow-y-hidden");
    } else if (dialogRef.current?.open) {
      dialogRef.current.close();
      document.body.classList.remove("overflow-y-hidden");
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
            <RegisterForm toClose={toClose} switchToLogin={() => setFormType("login")} />
          )}
        </div>

        <Button
          className="SignForm__close-button"
          onClick={() => toClose(false)}
        >
          <img src={cross} alt="Закрыть" />
        </Button>
      </div>
    </dialog>,
    document.getElementById("modal")
  );
}

function RegisterForm({ toClose, switchToLogin }) {
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { login, setError: setAuthError } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setAuthError(null);

    const fullName = surname ? `${name} ${surname}` : name;
    const phoneE164 = normalizePhoneToE164(phone);

    try {
      await registerUser({
        name: fullName,
        email,
        password,
        phone: phoneE164,
      });

      const loginResponse = await loginUser({ email, password });
      login(loginResponse.access_token);

      setName("");
      setSurname("");
      setEmail("");
      setPhone("");
      setPassword("");
      toClose(false);
      switchToLogin();
    } catch (e) {
      setError(e.message || "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3>Регистрация в Авторские Экскурсии</h3>
      <form className="InputForm RegisterForm" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Имя"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Фамилия"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PatternFormat
          format="+7 (###) ###-##-##"
          mask="_"
          value={phone}
          onValueChange={(values) => {
            setPhone(values.formattedValue);
          }}
          type="tel"
          placeholder="Телефон"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          minLength="8"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="SignForm__error">{error}</p>}
        <Button className="SignForm__submit-button" type="submit" disabled={submitting}>
          {submitting ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
      </form>
    </>
  );
}

function LoginForm({ toClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { login, setError: setAuthError } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setAuthError(null);
    try {
      const loginResponse = await loginUser({ email, password });
      login(loginResponse.access_token);
      setEmail("");
      setPassword("");
      toClose(false);
    } catch (e) {
      setError(e.message || "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3>Вход в Личный Кабинет</h3>
      <form className="InputForm LoginForm" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          minLength="8"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="SignForm__error">{error}</p>}
        <Button className="SignForm__submit-button" type="submit" disabled={submitting}>
          {submitting ? "Входим..." : "Войти"}
        </Button>
      </form>
    </>
  );
}

