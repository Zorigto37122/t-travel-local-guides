import React, { useState } from "react";
import "../SearchPage/SearchPage.css";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [formData, setFormData] = useState({
    country: "Россия",
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

  const handleCityCardClick = (cityName, countryName) => {
    const params = new URLSearchParams();
  
    params.set("country", countryName);
    params.set("city", cityName);
    params.set("people", String(formData.people));
  
    if (formData.date) params.set("date", formData.date);
    if (formData.hasChildren) params.set("has_children", "true");
  
    navigate(`/search?${params.toString()}`);
  };
  

  const POPULAR_CITIES = [
    { id: 1, name: "Санкт-Петербург", country: "Россия", count: 450, img: "https://i.ibb.co/ZzyFPWG9/images-2021-08-30-1618617108sankt-peterburg-krasivie-mesta-foto-large.jpg" },
    { id: 2, name: "Москва", country: "Россия", count: 320, img: "https://i.ibb.co/JhvLWTv/8.webp" },
    { id: 3, name: "Казань", country: "Россия", count: 150, img: "https://i.ibb.co/zTzVRLs8/optimize.webp" },
    { id: 4, name: "Сочи", country: "Россия", count: 200, img: "https://i.ibb.co/F4kgcsYS/26-picture-afb903ac.jpg" },
    { id: 5, name: "Стамбул", country: "Турция", count: 75, img: "https://i.ibb.co/SDXGVPH8/1574264160-sultanahm.jpg" },
    { id: 6, name: "Вена", country: "Австрия", count: 29, img: "https://i.ibb.co/4RMmXfkk/a938f68769195411fb67644ac02908e5.jpg" },
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

        <div className="search-field search-field--date">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="search-field-input search-field-input--date"
            min={new Date().toISOString().split('T')[0]}
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
          <label style={{ whiteSpace: 'nowrap' }}>
            <input style={{ width: "30%" }}
              type="checkbox"
              name="hasChildren"
              checked={formData.hasChildren}
              onChange={handleChange}
            />
            <span style={{ fontSize: "16px" }}>С детьми</span>
          </label>
        </div>

        <button className="search-button" onClick={handleSearch}>
          Искать
        </button>
      </div>

      <div className="feature-boxes">
        <div className="feature-box">
          <div className="feature-icon">🌏</div>
          <div className="feature-text">
            <div className="feature-title">На любой вкус</div>
            <p className="feature-description">
              Выбирайте экскурсии, основываясь на своих предпочтениях и отзывах других пользователей
            </p>
          </div>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🛩️</div>
          <div className="feature-text">
            <div className="feature-title">Больше выгоды</div>
            <p className="feature-description">
              Получайте кэшбек до 5% от Т-Банка реальными рублями
            </p>
          </div>
        </div>

        <div className="feature-box">
          <div className="feature-icon">🔐</div>
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
          <div key={city.id} className="city-card" onClick={() => handleCityCardClick(city.name, city.country)}>
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

