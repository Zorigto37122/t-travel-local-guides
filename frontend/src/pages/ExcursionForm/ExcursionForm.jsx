import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { useNavigate, useParams } from "react-router-dom";

import { createExcursion, updateExcursion, getExcursionById, uploadExcursionPhotos } from "../../api/excursionsApi";
import { translateError } from "../../api/userApi";
import "./ExcursionForm.css";

const ExcursionForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    country: "",
    city: "",
    difficulty: "Индивидуальная",
    transport: "",
    duration: "",
    price_type: "per_person",
    short_description: "",
    description: "",
    photos: "",
    price_per_person: "",
    accepted_payment_methods: "online,cash",
    available_slots: "",
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      loadExcursion();
    }
  }, [id, isEdit]);

  const loadExcursion = async () => {
    try {
      setLoading(true);
      const excursion = await getExcursionById(id);
      const photos = excursion.photos || "";

      setFormData({
        title: excursion.title || "",
        country: excursion.country || "",
        city: excursion.city || "",
        difficulty: excursion.difficulty || "Индивидуальная",
        transport: excursion.transport || "",
        duration: excursion.duration || "",
        price_type: excursion.price_type || "per_person",
        short_description: excursion.short_description || "",
        description: excursion.description || "",
        photos: photos,
        price_per_person: excursion.price_per_person?.toString() || "",
        accepted_payment_methods: excursion.accepted_payment_methods || "online,cash",
        available_slots: excursion.available_slots?.toString() || "",
      });

      if (photos) {
        const photoArray = photos.split(',').filter(p => p.trim());
        const urlPreviews = photoArray.map((photo, index) => {
          const photoUrl = photo.trim();
          let displayUrl;
          if (photoUrl.startsWith('data:image')) {
            displayUrl = photoUrl;
          } else if (photoUrl.startsWith('http')) {
            displayUrl = photoUrl;
          } else {
            const apiUrl = import.meta.env.VITE_API_URL ?? "";
            displayUrl = `${apiUrl}${photoUrl}`;
          }

          return {
            file: null,
            preview: displayUrl,
            originalUrl: photoUrl,
            name: `Изображение ${index + 1}`
          };
        });

        if (urlPreviews.length > 0) {
          setPhotoPreviews(urlPreviews);
        }
      }
    } catch (err) {
      setError(translateError(err.message || "Не удалось загрузить экскурсию"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError("Пожалуйста, выберите изображения");
      return;
    }

    setPhotoFiles(prev => [...prev, ...imageFiles]);

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, { file, preview: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removePhoto = (index) => {
    const preview = photoPreviews[index];
    if (preview.file) {
      setPhotoFiles(prev => prev.filter(f => f !== preview.file));
    }
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setCoverPhoto = (index) => {
    if (index === 0) return;
    setPhotoPreviews(prev => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const newFiles = photoPreviews.filter(p => p.file).map(p => p.file);
      let uploadedUrls = [];
      for (let i = 0; i < newFiles.length; i += 10) {
        const batch = newFiles.slice(i, i + 10);
        const batchUrls = await uploadExcursionPhotos(token, batch);
        uploadedUrls = [...uploadedUrls, ...batchUrls];
      }

      let newIdx = 0;
      const allUrls = photoPreviews.map(p => {
        if (p.file) return uploadedUrls[newIdx++] ?? null;
        return p.originalUrl || (p.preview?.startsWith('data:image') ? null : p.preview);
      }).filter(Boolean);

      const photosString = allUrls.length > 0 ? allUrls.join(',') : null;

      const submissionData = {
        ...formData,
        photos: photosString || null,
        price_per_person: parseFloat(formData.price_per_person) || 0,
        available_slots: formData.available_slots ? parseInt(formData.available_slots) : null,
      };

      if (isEdit) {
        await updateExcursion(token, parseInt(id), submissionData);
      } else {
        await createExcursion(token, submissionData);
      }

      navigate("/guide/dashboard");
    } catch (err) {
      setError(translateError(err.message || "Не удалось сохранить экскурсию"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="excursion-form-container">Загрузка...</div>;
  }

  return (
    <div className="excursion-form-container">
      <h1 className="excursion-form-title">
        {isEdit ? "Редактировать экскурсию" : "Добавить экскурсию"}
      </h1>

      {error && <div className="excursion-form-error">{error}</div>}

      <form className="excursion-form" onSubmit={handleSubmit}>
        <div className="excursion-form-field">
          <label htmlFor="title">Название экскурсии *</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required maxLength={200} placeholder="Например: Вечерняя прогулка по Москве" />
        </div>

        <div className="excursion-form-row">
          <div className="excursion-form-field">
            <label htmlFor="country">Страна *</label>
            <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} required placeholder="Россия" />
          </div>
          <div className="excursion-form-field">
            <label htmlFor="city">Город *</label>
            <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required placeholder="Москва" />
          </div>
        </div>

        <div className="excursion-form-row">
          <div className="excursion-form-field">
            <label htmlFor="difficulty">Формат проведения *</label>
            <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} required>
              <option value="Индивидуальная">Индивидуальная</option>
              <option value="Групповая">Групповая</option>
            </select>
          </div>
          <div className="excursion-form-field">
            <label htmlFor="transport">Способ передвижения</label>
            <select id="transport" name="transport" value={formData.transport} onChange={handleChange}>
              <option value="">Не указан</option>
              <option value="пешком">Пешком</option>
              <option value="на автобусе">На автобусе</option>
              <option value="на машине">На машине</option>
              <option value="на велосипеде">На велосипеде</option>
              <option value="на лодке">На лодке</option>
            </select>
          </div>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="duration">Длительность</label>
          <select id="duration" name="duration" value={formData.duration} onChange={handleChange}>
            <option value="">Не указана</option>
            <option value="1 час">1 час</option>
            <option value="1.5 часа">1.5 часа</option>
            <option value="2 часа">2 часа</option>
            <option value="3 часа">3 часа</option>
            <option value="4 часа">4 часа</option>
            <option value="5 часов">5 часов</option>
            <option value="6 часов">6 часов</option>
            <option value="весь день">Весь день</option>
          </select>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="short_description">Краткое описание <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}>до 300 символов</span></label>
          <textarea id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} rows={2} maxLength={300} placeholder="Кратко и цепко — что особенного в этой экскурсии?" />
        </div>

        <div className="excursion-form-field">
          <label htmlFor="description">Подробное описание <span style={{ fontWeight: 400, fontSize: 12, color: '#999', marginLeft: 8 }}># Заголовок · ## Подзаголовок</span></label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={8} placeholder={"# Об экскурсии\nПодробное описание..."} />
        </div>

        <div className="excursion-form-field">
          <label htmlFor="photos">
            Фотографии
            {photoPreviews.length > 0 && (
              <span style={{ fontWeight: 400, fontSize: 13, color: '#888', marginLeft: 8 }}>
                {photoPreviews.length} шт · первая — обложка карточки
              </span>
            )}
          </label>
          <input type="file" id="photos" name="photos" accept="image/*" multiple onChange={handlePhotoChange} style={{ marginBottom: '12px' }} />
          {photoPreviews.length > 0 && (
            <div className="excursion-photo-preview-container">
              {photoPreviews.map((preview, index) => (
                <div key={index} className={`excursion-photo-preview-item ${index === 0 ? 'excursion-photo-cover' : ''}`}>
                  <img src={preview.preview} alt={`Preview ${index + 1}`} />
                  <button type="button" className="excursion-photo-remove-btn" onClick={() => removePhoto(index)}>×</button>
                  {index === 0 ? (
                    <span className="excursion-photo-cover-badge">Обложка</span>
                  ) : (
                    <button type="button" className="excursion-photo-set-cover-btn" onClick={() => setCoverPhoto(index)} title="Сделать обложкой">★ Обложка</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="excursion-form-row">
          <div className="excursion-form-field">
            <label htmlFor="price_type">Тип цены *</label>
            <select id="price_type" name="price_type" value={formData.price_type} onChange={handleChange}>
              <option value="per_person">За человека</option>
              <option value="per_group">За группу</option>
            </select>
          </div>
          <div className="excursion-form-field">
            <label htmlFor="price_per_person">{formData.price_type === "per_group" ? "Цена за группу (₽) *" : "Цена за человека (₽) *"}</label>
            <input type="number" id="price_per_person" name="price_per_person" value={formData.price_per_person} onChange={handleChange} required min="0" step="0.01" placeholder="1500" />
          </div>
          <div className="excursion-form-field">
            <label htmlFor="available_slots">Доступных мест</label>
            <input type="number" id="available_slots" name="available_slots" value={formData.available_slots} onChange={handleChange} min="1" placeholder="Неограниченно" />
          </div>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="accepted_payment_methods">Способы оплаты</label>
          <select id="accepted_payment_methods" name="accepted_payment_methods" value={formData.accepted_payment_methods} onChange={handleChange}>
            <option value="online,cash">Онлайн и наличные</option>
            <option value="online">Только онлайн</option>
            <option value="cash">Только наличные</option>
          </select>
        </div>

        <div className="excursion-form-actions">
          <button type="button" className="excursion-form-cancel-btn" onClick={() => navigate("/guide/dashboard")}>Отмена</button>
          <button type="submit" className="excursion-form-submit-btn" disabled={saving}>
            {saving ? "Сохранение..." : isEdit ? "Сохранить изменения" : "Создать экскурсию"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExcursionForm;
