import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { getGuideProfile, updateGuideProfile, translateError } from "../../api/userApi";
import { getMyExcursions } from "../../api/excursionsApi";
import { useNavigate } from "react-router-dom";
import "./GuideDashboard.css";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function getAvatarUrl(photo) {
  if (!photo) return null;
  if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
  return `${API_URL}${photo}`;
}

const STATUS_META = {
  approved: { label: "Опубликована", cls: "ok" },
  pending_review: { label: "На модерации", cls: "pending" },
  draft: { label: "Черновик", cls: "draft" },
  rejected: { label: "Отклонена", cls: "rejected" },
};

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
  const [photoSaved, setPhotoSaved] = useState(false);
  const [bio, setBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [experience, setExperience] = useState("");
  const [expSaving, setExpSaving] = useState(false);
  const [expSaved, setExpSaved] = useState(false);

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
      setPhotoUrl(profile && profile.photo ? profile.photo : "");
      setBio(profile && profile.bio ? profile.bio : "");
      setExperience(profile && profile.experience ? profile.experience : "");
    } catch (err) {
      setError(translateError(err.message || "Не удалось загрузить данные"));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла слишком большой. Пожалуйста, выберите изображение размером менее 5 МБ.");
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите файл изображения.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoUrl(reader.result);
    reader.onerror = () => setError("Ошибка при чтении файла");
    reader.readAsDataURL(file);
  };

  const handleBioSave = async () => {
    setBioSaving(true);
    setBioSaved(false);
    try {
      await updateGuideProfile(token, { bio });
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 3000);
    } catch (err) {
      setError(translateError(err.message || "Не удалось сохранить описание"));
    } finally {
      setBioSaving(false);
    }
  };

  const handleExpSave = async () => {
    setExpSaving(true);
    setExpSaved(false);
    try {
      await updateGuideProfile(token, { experience });
      setExpSaved(true);
      setTimeout(() => setExpSaved(false), 3000);
    } catch (err) {
      setError(translateError(err.message || "Не удалось сохранить стаж"));
    } finally {
      setExpSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    try {
      setUpdating(true);
      setError(null);
      if (!photoUrl || !photoUrl.startsWith("data:image")) {
        setError("Ошибка: неверный формат изображения");
        return;
      }
      const updatedProfile = await updateGuideProfile(token, { photo: photoUrl });
      setGuideProfile(updatedProfile);
      if (updatedProfile && updatedProfile.photo) setPhotoUrl(updatedProfile.photo);
      setPhotoFile(null);
      setPhotoSaved(true);
      setTimeout(() => setPhotoSaved(false), 3000);
    } catch (err) {
      setError(translateError(err.message || "Не удалось обновить фотографию"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="gd-loading">Загружаем кабинет…</div>;
  }

  const avatarUrl = getAvatarUrl(photoUrl);
  const total = excursions.length;
  const published = excursions.filter((e) => e.status === "approved").length;
  const onModeration = excursions.filter((e) => e.status === "pending_review").length;

  return (
    <div className="gd-page">
      <div className="gd-container">
        <h1 className="gd-title">Кабинет гида</h1>

        {error && <div className="gd-error">{error}</div>}

        <div className="gd-hero">
          <div className="gd-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="gd-avatar" />
            ) : (
              <div className="gd-avatar gd-avatar--placeholder">{user.name?.[0] || "Г"}</div>
            )}
            <label htmlFor="gd-photo" className="gd-avatar-edit">Изменить фото</label>
            <input
              id="gd-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="gd-hero-info">
            <h2 className="gd-name">{user.name}</h2>
            <p className="gd-contact">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>

            <div className="gd-stats">
              <div className="gd-stat">
                <span className="gd-stat-value">{total}</span>
                <span className="gd-stat-label">экскурсий</span>
              </div>
              <div className="gd-stat">
                <span className="gd-stat-value">{published}</span>
                <span className="gd-stat-label">опубликовано</span>
              </div>
              <div className="gd-stat">
                <span className="gd-stat-value">{onModeration}</span>
                <span className="gd-stat-label">на модерации</span>
              </div>
            </div>

            {photoSaved && !photoFile && (
              <p className="gd-photo-saved">✓ Фото сохранено</p>
            )}
            {photoFile ? (
              <div className="gd-photo-actions">
                <button className="gd-btn gd-btn--primary" onClick={handlePhotoUpload} disabled={updating}>
                  {updating ? "Сохранение…" : "Сохранить фото"}
                </button>
                <button
                  className="gd-btn gd-btn--ghost"
                  onClick={() => { setPhotoFile(null); setPhotoUrl(guideProfile?.photo || ""); }}
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="gd-hero-actions">
                <button className="gd-btn gd-btn--primary" onClick={() => navigate("/guide/excursions/new")}>
                  + Добавить экскурсию
                </button>
                <button className="gd-btn gd-btn--ghost" onClick={() => navigate("/guide/calendar")}>
                  Календарь бронирований
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="gd-card gd-bio-card">
          <div className="gd-section-head" style={{ marginBottom: 12 }}>
            <h2 className="gd-section-title" style={{ fontSize: 18 }}>О себе</h2>
            {bioSaved && <span className="gd-photo-saved">✓ Сохранено</span>}
          </div>
          <textarea
            className="gd-bio-textarea"
            placeholder="Расскажите о себе: опыт, специализация, что делает ваши экскурсии особенными…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
          <button className="gd-btn gd-btn--primary gd-bio-save" onClick={handleBioSave} disabled={bioSaving}>
            {bioSaving ? "Сохранение…" : "Сохранить описание"}
          </button>
        </div>

        <div className="gd-card gd-bio-card">
          <div className="gd-section-head" style={{ marginBottom: 12 }}>
            <h2 className="gd-section-title" style={{ fontSize: 18 }}>Стаж</h2>
            {expSaved && <span className="gd-photo-saved">✓ Сохранено</span>}
          </div>
          <input
            className="gd-bio-textarea"
            style={{ padding: "10px 14px", resize: "none", height: "auto" }}
            placeholder="Например: 5 лет"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
          <button className="gd-btn gd-btn--primary gd-bio-save" onClick={handleExpSave} disabled={expSaving}>
            {expSaving ? "Сохранение…" : "Сохранить стаж"}
          </button>
        </div>

        <div className="gd-section-head">
          <h2 className="gd-section-title">Мои экскурсии</h2>
          <button className="gd-add-link" onClick={() => navigate("/guide/excursions/new")}>+ Добавить</button>
        </div>

        {excursions.length === 0 ? (
          <div className="gd-empty">
            <p>У вас пока нет экскурсий</p>
            <button className="gd-btn gd-btn--primary" onClick={() => navigate("/guide/excursions/new")}>
              Создать первую экскурсию
            </button>
          </div>
        ) : (
          <div className="gd-excursions">
            {excursions.map((ex) => {
              const meta = STATUS_META[ex.status] || { label: ex.status, cls: "draft" };
              const isGroup = ex.price_type === "per_group";
              return (
                <div key={ex.excursion_id} className="gd-card">
                  <div className="gd-card-main">
                    <div className="gd-card-top">
                      <h3 className="gd-card-title">{ex.title}</h3>
                      <span className={`gd-badge gd-badge--${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="gd-card-loc">{ex.city}, {ex.country}</p>
                    <p className="gd-card-price">
                      {Number(ex.price_per_person).toLocaleString("ru-RU")} ₽
                      <span className="gd-card-price-type">{isGroup ? " за группу" : " за человека"}</span>
                    </p>
                  </div>
                  <div className="gd-card-actions">
                    <button className="gd-btn gd-btn--ghost" onClick={() => navigate(`/guide/excursions/${ex.excursion_id}/edit`)}>
                      Редактировать
                    </button>
                    <button className="gd-btn gd-btn--accent" onClick={() => navigate(`/guide/excursions/${ex.excursion_id}/schedule`)}>
                      Расписание
                    </button>
                    {ex.status === "approved" && (
                      <button className="gd-btn gd-btn--ghost" onClick={() => navigate(`/excursions/${ex.excursion_id}`)}>
                        Открыть
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideDashboard;
