import React, { useState } from "react";
import "../SearchPage/SearchPage.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [formData, setFormData] = useState({
    country: "",
    city: "",
    date: "",
    people: 1,
    hasChildren: false,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (formData.country) params.set("country", formData.country);
    if (formData.city) params.set("city", formData.city);
    if (formData.date) params.set("date", formData.date);
    if (formData.people) params.set("people", String(formData.people));
    if (formData.hasChildren) params.set("has_children", "true");

    navigate(`/search?${params.toString()}`);
  };

  const POPULAR_CITIES = [
    { id: 1, name: "Санкт-Петербург", count: 450, img: "https://dummyimage.com/400x350/000/fff" },
    { id: 2, name: "Москва", count: 320, img: "https://dummyimage.com/400x350/000/fff" },
    { id: 3, name: "Казань", count: 150, img: "https://dummyimage.com/400x350/000/fff" },
    { id: 4, name: "Сочи", count: 200, img: "https://dummyimage.com/400x350/000/fff" },
    { id: 5, name: "Стамбул", count: 75, img: "https://dummyimage.com/400x350/000/fff" },
    { id: 6, name: "Вена", count: 29, img: "https://dummyimage.com/400x350/000/fff" },
  ];


  return (
    <div className="search-page-container">
      <h2 className="page-title">Авторские Экскурсии</h2>

      <div className="search-wrapper">
        <div className="search-field">
          <input
            type="text"
            name="country"
            placeholder="Страна"
            value={formData.country}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <input
            type="text"
            name="city"
            placeholder="Город"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <input
            type="date"
            name="date"
            placeholder="Дата"
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <label>Кол-во человек</label>
          <input
            type="number"
            name="people"
            min="1"
            value={formData.people}
            onChange={handleChange}
          />
        </div>

        <div className="search-field search-field--checkbox">
          <label>
            <input
              type="checkbox"
              name="hasChildren"
              checked={formData.hasChildren}
              onChange={handleChange}
            />
            С детьми
          </label>
        </div>

        <button className="search-button" onClick={handleSearch}>
          Искать
        </button>
      </div>

      <div className="feature-boxes">
        <div className="feature-box">
          <div className="feature-icon">🗺️</div>
          <div className="feature-text">
            <div className="feature-title">На любой вкус</div>
            <p className="feature-description">
              Выбирайте экскурсии, основываясь на своих предпочтениях и отзывах других пользователей
            </p>
          </div>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🗺️</div>
          <div className="feature-text">
            <div className="feature-title">Больше выгоды</div>
            <p className="feature-description">
              Получайте кэшбек до 5% от Т-Банка реальными рублями
            </p>
          </div>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🗺️</div>
          <div className="feature-text">
            <div className="feature-title">Безопасная покупка</div>
            <p className="feature-description">
              Оплачивайте экскурсии у проверенных гидов через T-Pay без ввода реквизитов карты
            </p>
          </div>
        </div>
      </div>

      <h3 className="second-page-title">Популярные города у наших путешественников</h3>
      <div className="cities-grid">
        {POPULAR_CITIES.map((city) => (
          <div key={city.id} className="city-card">
            <div className="city-image-wrapper">
              <img src={city.img} alt={city.name} />
            </div>

            <div className="city-info">
              <h3 className="city-name">{city.name}</h3>
              <span className="city-count">{city.count} экскурсий</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;

