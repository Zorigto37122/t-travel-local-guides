import { PatternFormat } from "react-number-format";
import { useState } from "react";
import Button from "../Button/Button";

export default function LoginForm({ toClose }) {
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
