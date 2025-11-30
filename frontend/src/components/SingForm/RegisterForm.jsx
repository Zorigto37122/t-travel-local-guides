import { PatternFormat } from "react-number-format";
import { useState } from "react";
import Button from "../Button/Button";

export default function RegisterForm({ toClose }) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (cleanPhone.length !== 11) {
      setPhoneError("Пожалуйста, введите полный номер телефона.");
      console.error("Неполный номер телефона.");
      return;
    }
    setPhoneError("");

    if (password !== confirmPassword) {
      setPasswordMatchError("Пароли не совпадают!");
      console.error("Пароли не совпадают.");
      return;
    } else {
      setPasswordMatchError("");
    }

    const registerData = {
      name: name,
      surname: surname,
      phone: cleanPhone,
      password: password,
    };
    console.log("Данные регистрации:", registerData);

    setName("");
    setSurname("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    toClose(false);
  };

  return (
    <>
      <h3>Регистрация в Авторские Экскурсии</h3>
      <form className="InputForm RegisterForm" onSubmit={handleSubmit}>
        {phoneError && <p className="Form__error-message">{phoneError}</p>}
        {passwordMatchError && (
          <p className="Form__error-message">{passwordMatchError}</p>
        )}
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
          format="+7 (###) ###-##-##" // 👈 Формат маски
          mask="_" // Символ-заполнитель
          value={phone}
          onValueChange={(values) => {
            setPhone(values.formattedValue);
          }}
          type="tel"
          placeholder="Телефон"
          required
          aria-invalid={!!phoneError}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          minLength="8"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          minLength="8"
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={!!passwordMatchError}
        />

        <Button className="SignForm__submit-button" type="submit">
          Зарегистрироваться
        </Button>
      </form>
    </>
  );
}
