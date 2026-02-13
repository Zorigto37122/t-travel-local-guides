import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchPage.css";

const SearchPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        country: 'Россия',
        city: '',
        date: '',
        people: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const handleSearch = () => {
        if (!formData.city && !formData.country) {
            alert("Пожалуйста, введите город или страну для поиска.");
            return;
        }

        const params = new URLSearchParams({
            city: formData.city || '',
            country: formData.country || '',
            date: formData.date || '',
            people: formData.people
        }).toString();
        
        navigate(`/results?${params}`);
    };


    const handleCityCardClick = (cityName) => {
        const params = new URLSearchParams({
            city: cityName
        }).toString();
        
        navigate(`/results?${params}`);
    };

    const POPULAR_CITIES = [
        { id: 1, name: 'Санкт-Петербург', count: 450, img: 'https://i.ibb.co/ZzyFPWG9/images-2021-08-30-1618617108sankt-peterburg-krasivie-mesta-foto-large.jpg' },
  { id: 2, name: 'Москва', count: 320, img: 'https://i.ibb.co/JhvLWTv/8.webp' },
  { id: 3, name: 'Казань', count: 150, img: 'https://i.ibb.co/zTzVRLs8/optimize.webp' },
  { id: 4, name: 'Париж', count: 200, img: 'https://i.ibb.co/F4kgcsYS/26-picture-afb903ac.jpg' },
  { id: 5, name: 'Стамбул', count: 75, img: 'https://i.ibb.co/SDXGVPH8/1574264160-sultanahm.jpg' },
  { id: 6, name: 'Вена', count: 29, img: 'https://i.ibb.co/4RMmXfkk/a938f68769195411fb67644ac02908e5.jpg' },
    ];

//     https://ibb.co/TMDmJK0V
// https://ibb.co/TMRv7Tyy
// https://ibb.co/hqB5xNB
// https://ibb.co/5hqSyBGZ
// https://ibb.co/YFxBkK2D
// https://ibb.co/7xJLrXB5
    const formattedPeople = `${formData.people} взрослый`;

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
                        type="text"
                        name="people"
                        min="1"
                        readOnly={true}
                        
                        value={formattedPeople}
                        onChange={handleChange}
                    />
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
                        <p className="feature-description">Выбирайте экскурсии, основываясь на своих предпочтениях и отзывах других пользователей</p>
                    </div>
                </div>

                <div className="feature-box">
                    <div className="feature-icon">🗺️</div>
                    <div className="feature-text">
                        <div className="feature-title">Больше выгоды</div>
                        <p className="feature-description">Получайте кэшбек до 5% от Т-Банка реальными рублями</p>
                    </div>
                </div>

                <div className="feature-box">
                    <div className="feature-icon">🗺️</div>
                    <div className="feature-text">
                        <div className="feature-title">Безопасная покупка</div>
                        <p className="feature-description">Оплачивайте экскурсии у проверенных гидов через T-Pay без ввода реквизитов карты</p>
                    </div>
                </div>
            </div>

            <h3 className="second-page-title">Популярные города у наших путешественников</h3>
            <div className="cities-grid">
                {POPULAR_CITIES.map((city) => (
                    <div key={city.id} className="city-card" onClick={() => handleCityCardClick(city.name)}>
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
export default SearchPage;