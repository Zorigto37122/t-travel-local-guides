import React, { useState } from "react";
import ExcursionCard from "../ExcursionCard/ExcursionCard";
import "./SearchPage.css";

const SearchPage = () => {
    const [formData, setFormData] = useState({
        country: '',
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

    };

    const POPULAR_CITIES = [
        { id: 1, name: 'Санкт-Петербург', count: 450, img: 'https://dummyimage.com/400x350/000/fff' },
  { id: 2, name: 'Москва', count: 320, img: 'https://dummyimage.com/400x350/000/fff' },
  { id: 3, name: 'Казань', count: 150, img: 'https://dummyimage.com/400x350/000/fff' },
  { id: 4, name: 'Сочи', count: 200, img: 'https://dummyimage.com/400x350/000/fff' },
  { id: 5, name: 'Стамбул', count: 75, img: 'https://dummyimage.com/400x350/000/fff' },
  { id: 6, name: 'Вена', count: 29, img: 'https://dummyimage.com/400x350/000/fff' },
    ];
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
export default SearchPage;