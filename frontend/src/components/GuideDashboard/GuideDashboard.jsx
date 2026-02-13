import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { getGuideProfile, updateGuideProfile, getMyExcursions, translateError } from "../../api";
import { useNavigate } from "react-router-dom";
import "./GuideDashboard.css";

const GuideDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [guideProfile, setGuideProfile] = useState(null);
  const [excursions, setExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate("/");
      return;
    }
    loadData();
  }, [user, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profile, excursionsData] = await Promise.all([
        getGuideProfile(token),
        getMyExcursions(token),
      ]);
      setGuideProfile(profile);
      setExcursions(excursionsData);
      // Обновляем photoUrl из профиля
      if (profile && profile.photo) {
        setPhotoUrl(profile.photo);
      } else {
        setPhotoUrl("");
      }
    } catch (err) {
      setError(translateError(err.message || "Не удалось загрузить данные"));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверяем размер файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError("Размер файла слишком большой. Пожалуйста, выберите изображение размером менее 5 МБ.");
        e.target.value = ""; // Очищаем input
        return;
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setError("Пожалуйста, выберите файл изображения.");
        e.target.value = "";
        return;
      }

      setPhotoFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.onerror = () => {
        setError("Ошибка при чтении файла");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    try {
      setUpdating(true);
      setError(null);
      
      // Используем base64 из preview
      const photoDataUrl = photoUrl;
      
      if (!photoDataUrl || !photoDataUrl.startsWith('data:image')) {
        setError("Ошибка: неверный формат изображения");
        return;
      }

      const updatedProfile = await updateGuideProfile(token, { photo: photoDataUrl });
      // Обновляем состояние из ответа сервера
      setGuideProfile(updatedProfile);
      if (updatedProfile && updatedProfile.photo) {
        setPhotoUrl(updatedProfile.photo);
      }
      setPhotoFile(null);
      setError(null);
      alert("Фотография успешно обновлена");
    } catch (err) {
      console.error("Ошибка загрузки фото:", err);
      setError(translateError(err.message || "Не удалось обновить фотографию"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="guide-dashboard-container">Загрузка...</div>;
  }

  return (
    <div className="guide-dashboard-container">
      <h1 className="guide-dashboard-title">Личный кабинет гида</h1>

      {error && <div className="guide-dashboard-error">{error}</div>}

      <div className="guide-dashboard-content">
        <div className="guide-profile-section">
          <h2>Профиль гида</h2>
          <div className="guide-photo-section">
            <div className="guide-photo-preview">
              {photoUrl ? (
                <img src={photoUrl} alt="Фото гида" />
              ) : (
                <div className="guide-photo-placeholder">Нет фото</div>
              )}
            </div>
            <div className="guide-photo-controls">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                id="photo-upload"
                style={{ display: "none" }}
              />
              <label htmlFor="photo-upload" className="guide-photo-upload-btn">
                Выбрать фото
              </label>
              {photoFile && (
                <button
                  onClick={handlePhotoUpload}
                  disabled={updating}
                  className="guide-photo-save-btn"
                >
                  {updating ? "Сохранение..." : "Сохранить фото"}
                </button>
              )}
            </div>
          </div>
          <div className="guide-info">
            <p><strong>Имя:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.phone && <p><strong>Телефон:</strong> {user.phone}</p>}
          </div>
        </div>

        <div className="guide-excursions-section">
          <div className="guide-excursions-header">
            <h2>Мои экскурсии ({excursions.length})</h2>
            <button
              className="guide-add-excursion-btn"
              onClick={() => navigate("/guide/excursions/new")}
            >
              + Добавить экскурсию
            </button>
          </div>
          {excursions.length === 0 ? (
            <p className="guide-no-excursions">У вас пока нет экскурсий</p>
          ) : (
            <div className="guide-excursions-list">
              {excursions.map((excursion) => (
                <div key={excursion.excursion_id} className="guide-excursion-card">
                  <div className="guide-excursion-info">
                    <h3>{excursion.title}</h3>
                    <p>{excursion.city}, {excursion.country}</p>
                    <p className="guide-excursion-status">
                      Статус: <span className={`status-${excursion.status}`}>
                        {excursion.status === "approved" ? "Одобрена" :
                         excursion.status === "pending_review" ? "На модерации" :
                         excursion.status === "draft" ? "Черновик" : excursion.status}
                      </span>
                    </p>
                    <p className="guide-excursion-price">
                      {excursion.price_per_person} ₽ за человека
                    </p>
                  </div>
                  <div className="guide-excursion-actions">
                    <button
                      className="guide-edit-btn"
                      onClick={() => navigate(`/guide/excursions/${excursion.excursion_id}/edit`)}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="guide-calendar-section">
          <h2>Календарь бронирований</h2>
          <button
            className="guide-calendar-btn"
            onClick={() => navigate("/guide/calendar")}
          >
            Открыть календарь
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideDashboard;
