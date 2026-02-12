import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { updateUser, translateError, loginUser } from "../../api";
import { PatternFormat } from "react-number-format";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, token, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    if (user) {
      // Форматируем телефон для отображения
      let formattedPhone = user.phone || "";
      if (formattedPhone) {
        // Если телефон в формате E164 (+79991234567), конвертируем в формат для отображения
        const digits = formattedPhone.replace(/[^\d]/g, "");
        if (digits.startsWith("7") && digits.length === 11) {
          formattedPhone = `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
        } else if (!formattedPhone.match(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/)) {
          // Если формат не соответствует ожидаемому, пытаемся исправить
          if (digits.length >= 11 && digits.startsWith("7")) {
            formattedPhone = `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
          } else {
            formattedPhone = "";
          }
        }
      }
      
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: formattedPhone,
        oldPassword: "",
        password: "",
        confirmPassword: "",
      });
      setPasswordChanged(false);
    }
  }, [user]);

  function normalizePhoneToE164(maskedPhone) {
    if (!maskedPhone) return null;
    const digits = maskedPhone.replace(/[^\d]/g, "");
    if (!digits) return null;
    if (digits.startsWith("7")) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Валидация пароля
      if (formData.password || formData.confirmPassword || formData.oldPassword) {
        if (!formData.oldPassword) {
          setError("Для изменения пароля необходимо ввести старый пароль");
          setLoading(false);
          return;
        }
        if (!formData.password) {
          setError("Введите новый пароль");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Новый пароль и подтверждение не совпадают");
          setLoading(false);
          return;
        }
      }

      const updateData = {};
      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }
      
      const phoneE164 = normalizePhoneToE164(formData.phone);
      const currentPhoneE164 = normalizePhoneToE164(user.phone);
      if (phoneE164 !== currentPhoneE164) {
        updateData.phone = phoneE164;
      }
      
      if (formData.password && formData.oldPassword) {
        // Проверяем, что старый пароль правильный, пытаясь войти с ним
        try {
          await loginUser({ email: user.email, password: formData.oldPassword });
        } catch (loginError) {
          setError(translateError("Неверный старый пароль"));
          setLoading(false);
          return;
        }
        // Если старый пароль правильный, обновляем на новый
        updateData.password = formData.password;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage("Нет изменений для сохранения");
        setLoading(false);
        return;
      }

      const updatedUser = await updateUser(token, updateData);
      setUser(updatedUser);
      
      // Проверяем, был ли изменен пароль
      const wasPasswordChanged = formData.password && formData.oldPassword;
      if (wasPasswordChanged) {
        setPasswordChanged(true);
        setMessage("Пароль успешно изменен");
      } else {
        setMessage("Данные успешно обновлены");
      }
      
      setFormData((prev) => ({ 
        ...prev, 
        oldPassword: "",
        password: "",
        confirmPassword: "" 
      }));
    } catch (err) {
      const errorMessage = translateError(err.message || "Не удалось обновить данные");
      setError(errorMessage);
      setPasswordChanged(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <p>Пожалуйста, войдите в систему</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Редактирование профиля</h1>
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-field">
          <label htmlFor="name">Имя</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={50}
          />
        </div>

        <div className="profile-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="profile-field-disabled"
          />
          <p className="profile-field-hint">Email нельзя изменить</p>
        </div>

        <div className="profile-field">
          <label htmlFor="phone">Телефон</label>
          <PatternFormat
            format="+7 (###) ###-##-##"
            mask="_"
            value={formData.phone || ""}
            allowEmptyFormatting={true}
            onValueChange={(values) => {
              setFormData((prev) => ({
                ...prev,
                phone: values.formattedValue,
              }));
              setMessage(null);
              setError(null);
              setPasswordChanged(false);
            }}
            type="tel"
            placeholder="+7 (999) 123-45-67"
            className="profile-field-input"
            getInputRef={(el) => {
              if (el) {
                el.setAttribute('inputmode', 'numeric');
              }
            }}
          />
          <p className="profile-field-hint">Формат: +7 (999) 123-45-67</p>
        </div>

        <div className="profile-field">
          <label htmlFor="oldPassword">Старый пароль</label>
          <input
            type="password"
            id="oldPassword"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            placeholder="Введите для изменения пароля"
            className="profile-field-input"
          />
          <p className="profile-field-hint">Требуется для изменения пароля</p>
        </div>

        <div className="profile-field">
          <label htmlFor="password">Новый пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Оставьте пустым, чтобы не менять"
            minLength={8}
            className="profile-field-input"
          />
          <p className="profile-field-hint">
            Минимум 8 символов, должна быть заглавная и строчная буква, цифра и специальный символ
          </p>
        </div>

        <div className="profile-field">
          <label htmlFor="confirmPassword">Подтверждение нового пароля</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Повторите новый пароль"
            minLength={8}
            className="profile-field-input"
          />
          <p className="profile-field-hint">Повторите новый пароль</p>
        </div>

        {passwordChanged && (
          <div className="profile-message profile-message-success">
            Пароль успешно изменен
          </div>
        )}
        {message && !passwordChanged && (
          <div className="profile-message profile-message-success">
            {message}
          </div>
        )}

        {error && (
          <div className="profile-message profile-message-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="profile-submit-button"
          disabled={loading}
        >
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
