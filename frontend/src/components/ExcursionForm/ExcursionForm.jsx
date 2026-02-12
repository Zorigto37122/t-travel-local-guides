import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { createExcursion, updateExcursion, getExcursionById, translateError } from "../../api";
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
    difficulty: "легко",
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
        difficulty: excursion.difficulty || "легко",
        description: excursion.description || "",
        photos: photos,
        price_per_person: excursion.price_per_person?.toString() || "",
        accepted_payment_methods: excursion.accepted_payment_methods || "online,cash",
        available_slots: excursion.available_slots?.toString() || "",
      });

      // Если есть фотографии, пытаемся определить base64 и показать их в превью
      if (photos) {
        const photoArray = photos.split(',').filter(p => p.trim());
        const base64Previews = photoArray
          .filter(photo => photo.trim().startsWith('data:image'))
          .map((photo, index) => ({
            file: null, // Это существующее изображение, не файл
            preview: photo.trim(),
            name: `Изображение ${index + 1}`
          }));
        
        if (base64Previews.length > 0) {
          setPhotoPreviews(base64Previews);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError("Пожалуйста, выберите изображения");
      return;
    }

    // Ограничиваем количество фотографий (например, максимум 10)
    const maxPhotos = 10;
    const filesToAdd = imageFiles.slice(0, maxPhotos - photoFiles.length);
    
    if (filesToAdd.length < imageFiles.length) {
      setError(`Можно загрузить максимум ${maxPhotos} фотографий`);
    }

    setPhotoFiles(prev => [...prev, ...filesToAdd]);
    
    // Создаем превью для новых файлов
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, {
          file: file,
          preview: reader.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    setError(null);
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const convertFilesToBase64 = async (files) => {
    const base64Promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(base64Promises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let photosString = "";
      
      // Собираем все фотографии: существующие base64 из превью и новые загруженные файлы
      const existingBase64Photos = photoPreviews
        .filter(preview => preview.preview.startsWith('data:image'))
        .map(preview => preview.preview);
      
      // Конвертируем новые загруженные файлы в base64
      let newBase64Photos = [];
      if (photoFiles.length > 0) {
        newBase64Photos = await convertFilesToBase64(photoFiles);
      }
      
      // Объединяем существующие base64 и новые
      const allBase64Photos = [...existingBase64Photos, ...newBase64Photos];
      
      // Если есть существующие URL (не base64), добавляем их
      const existingUrls = formData.photos 
        ? formData.photos.split(',').filter(p => p.trim() && !p.trim().startsWith('data:image'))
        : [];
      
      // Объединяем все: сначала base64, потом URL
      photosString = [...allBase64Photos, ...existingUrls].join(',') || null;

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
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder="Например: Вечерняя прогулка по Москве"
          />
        </div>

        <div className="excursion-form-row">
          <div className="excursion-form-field">
            <label htmlFor="country">Страна *</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              placeholder="Россия"
            />
          </div>

          <div className="excursion-form-field">
            <label htmlFor="city">Город *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Москва"
            />
          </div>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="difficulty">Сложность *</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
          >
            <option value="легко">Легко</option>
            <option value="средне">Средне</option>
            <option value="сложно">Сложно</option>
          </select>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            placeholder="Подробное описание экскурсии..."
          />
        </div>

        <div className="excursion-form-field">
          <label htmlFor="photos">Фотографии</label>
          <input
            type="file"
            id="photos"
            name="photos"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            style={{ marginBottom: '12px' }}
          />
          {photoPreviews.length > 0 && (
            <div className="excursion-photo-preview-container">
              {photoPreviews.map((preview, index) => (
                <div 
                  key={index} 
                  className={`excursion-photo-preview-item ${!preview.file ? 'excursion-photo-existing' : ''}`}
                >
                  <img src={preview.preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="excursion-photo-remove-btn"
                    onClick={() => removePhoto(index)}
                  >
                    ×
                  </button>
                  <span className="excursion-photo-name">{preview.name}</span>
                </div>
              ))}
            </div>
          )}
          {formData.photos && !photoPreviews.length && (
            <div className="excursion-photo-url-info">
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Текущие фотографии: {formData.photos.split(',').length} URL
              </p>
            </div>
          )}
        </div>

        <div className="excursion-form-row">
          <div className="excursion-form-field">
            <label htmlFor="price_per_person">Цена за человека (₽) *</label>
            <input
              type="number"
              id="price_per_person"
              name="price_per_person"
              value={formData.price_per_person}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="1500"
            />
          </div>

          <div className="excursion-form-field">
            <label htmlFor="available_slots">Доступных мест (оставьте пустым для неограниченного)</label>
            <input
              type="number"
              id="available_slots"
              name="available_slots"
              value={formData.available_slots}
              onChange={handleChange}
              min="1"
              placeholder="Неограниченно"
            />
          </div>
        </div>

        <div className="excursion-form-field">
          <label htmlFor="accepted_payment_methods">Способы оплаты</label>
          <select
            id="accepted_payment_methods"
            name="accepted_payment_methods"
            value={formData.accepted_payment_methods}
            onChange={handleChange}
          >
            <option value="online,cash">Онлайн и наличные</option>
            <option value="online">Только онлайн</option>
            <option value="cash">Только наличные</option>
          </select>
        </div>

        <div className="excursion-form-actions">
          <button
            type="button"
            className="excursion-form-cancel-btn"
            onClick={() => navigate("/guide/dashboard")}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="excursion-form-submit-btn"
            disabled={saving}
          >
            {saving ? "Сохранение..." : isEdit ? "Сохранить изменения" : "Создать экскурсию"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExcursionForm;
