import React, { useState } from "react";
import "./SearchPage.css";
import ExcursionCard from "../ExcursionCard/ExcursionCard";

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

    const EXCURSIONS_DATA = [
  {
    id: 1,
    image: 'https://avatars.mds.yandex.net/i?id=deae90dd3d9efadb7b1ef2853d0984c3_l-10697157-images-thumbs&n=13',
    type: 'Групповая',
    duration: '3 часа',
    title: 'Обзорная экскурсия по Москве на автобусе',
    description: 'Увидеть главные достопримечательности и посетить лучшие смотровые площадки столицы.',
    price: 1400,
    priceType: 'с человека',
    transport: 'на автобусе',
    rating: 9.8,
    reviewsCount: 123,
    guide: {
      name: 'Владимир',
      avatar: 'https://s.cq.ru/img/t/e/2025/10/06/698795-960.jpg'
    }
  },
  {
    id: 2,
    image: 'https://cdnstatic.rg.ru/uploads/images/167/10/51/iStock-502529960.jpg',
    type: 'Индивидуальная',
    duration: '2 часа',
    title: 'Тайны старого Арбата',
    description: 'Пешеходная прогулка по самым загадочным переулкам с погружением в историю.',
    price: 5000,
    priceType: 'за группу',
    transport: 'пешком',
    rating: 10.0,
    reviewsCount: 45,
    guide: {
      name: 'Елена',
      avatar: 'https://distribution.faceit-cdn.net/images/b94611c4-d72d-4dca-b450-b12307cd0012.jpg'
    }
  }
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

            <div className="excursions-grid">
                {EXCURSIONS_DATA.map(excursion => (
                    <ExcursionCard
                    key={excursion.id}
                    {...excursion}
                    />
                ))}
            </div>  
        </div>

        
                
        
    );
};
export default SearchPage;