import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExcursionById } from '../../api_test/excursionsapi'; 
import Button from '../../components/Button/Button';
import './ExcursionPage.css';

const guideAvatar = 'https://dummyimage.com/60x60/808080/fff&text=G'; 
const reviewAvatar = 'https://dummyimage.com/40x40/ddd/000&text=U'; 

// Временные данные для макета
const mockGallery = [
    'https://dummyimage.com/200x150/000/fff&text=G1',
    'https://dummyimage.com/200x150/000/fff&text=G2',
    'https://dummyimage.com/200x150/000/fff&text=G3',
    'https://dummyimage.com/200x150/000/fff&text=G4',
];
const mockReviews = [
    { id: 1, name: 'Игорь', date: '15 июня 2023', text: 'Очень содержательная и интересная прогулка. Гид отлично знает материал.', rating: 5 },
    { id: 2, name: 'Владимир', date: '5 марта 2024', text: 'Немного сумбурно, но в целом впечатления хорошие.', rating: 4 },
];
const mockSimilarExcursions = [
    { id: 301, title: 'Обзорная экскурсия по Москве', price: 2400, rating: 4.8 },
    { id: 302, title: 'Москва-Сити: вчера, сегодня...', price: 1700, rating: 5.0 },
];


export default function ExcursionPage() {
    const { id } = useParams(); 
    
    const [excursion, setExcursion] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadExcursion = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getExcursionById(id); 
                if (!data) {
                    throw new Error("Экскурсия не найдена");
                }
                setExcursion(data);
            } catch (err) {
                console.error("Ошибка при загрузке экскурсии:", err);
                setError(err.message || "Не удалось загрузить детали экскурсии.");
            } finally {
                setIsLoading(false);
            }
        };
        loadExcursion();
    }, [id]);

    if (isLoading) {
        return <div className="ExcursionPage__loading">Загрузка деталей экскурсии #{id}...</div>;
    }
    
    if (error) {
        return <div className="ExcursionPage__error">{error}</div>;
    }
    
    // Временные заглушки для мета-информации, отсутствующей в mockExcursions
    const mockRatingValue = (excursion.rating || 9.9).toFixed(1); 
    const mockReviewCount = excursion.id === 101 ? 98 : 45;
    const mockPrice = (excursion.price || 6500).toLocaleString('ru-RU');


    return (
        <div className="ExcursionPage">
            
            {/* 1. ВЕРХНИЙ БЛОК: Заголовок, Рейтинг, Цена */}
            <div className="ExcursionPage__header-info">
                <span className="ExcursionPage__recommendation">Советуем</span>
                <h1 className="ExcursionPage__title">{excursion.title}</h1>
                
                <div className="ExcursionPage__meta-top">
                    <div className="ExcursionPage__rating-group">
                        <span className="ExcursionPage__rating-value">{mockRatingValue}</span>
                        <span className="ExcursionPage__rating-text">Превосходно</span>
                        <span className="ExcursionPage__review-count">{mockReviewCount} оценок</span>
                    </div>
                    
                    <div className="ExcursionPage__price-block">
                        <span className="ExcursionPage__price-value">{mockPrice} ₽</span>
                        <span className="ExcursionPage__price-unit">с группы</span>
                        <Button className="ExcursionPage__book-button-top">Выбрать дату</Button>
                    </div>
                </div>
            </div>

            <div className="ExcursionPage__gallery">
                <img src="https://resize.tripster.ru/fMVMs7s7TJ2ZgQENY7YksfWdgNI=/fit-in/1200x1000/filters:no_upscale()/https://cdn.tripster.ru/photos/3577a70f-46ed-496b-b123-fe6556b317fe.jpg" alt="Главное фото" className="ExcursionPage__main-photo" />
                <div className="ExcursionPage__thumbnails">
                    {mockGallery.map((src, index) => (
                        <img key={index} src={src} alt={`Превью ${index + 1}`} />
                    ))}
                </div>
            </div>

            {/* 3. ГЛАВНЫЙ GRID: Описание (слева) и Сайдбар (справа) */}
            <div className="ExcursionPage__main-grid">
                
                {/* ЛЕВАЯ КОЛОНКА: Описание, Детали, Отзывы */}
                <div className="ExcursionPage__left-column">
                    
                    {/* ОБ ЭКСКУРСИИ */}
                    <section className="ExcursionPage__section ExcursionPage__about">
                        <h2>Об экскурсии</h2>
                        <p className="ExcursionPage__description-text">{excursion.description}</p>
                        
                        <h3>За что стоит посетить {excursion.city}</h3>
                        <p>С момента постройки это место многие невзлюбили за китчевость и близость к Черкизовскому рынку, а историки ругали авторов за слова о воссозданном дворце Алексея Михайловича...</p>
                        
                        <h3>В гостях у царя</h3>
                        <p>Измайлово исторически то же самое, что и сам Кремль, только на острове, в центре Москвы-реки, что-то сказочное и авторское. Тему свободы творчества и воплощения...</p>
                        
                    </section>
                    
                    {/* ОРГАНИЗАЦИОННЫЕ ДЕТАЛИ */}
                    <section className="ExcursionPage__section ExcursionPage__details">
                        <h2>Организационные детали</h2>
                        <ul>
                            <li>Опоздание засчитаем без дополнительных расходов</li>
                            <li>Возврат средств гарантирован</li>
                            <li>...</li>
                        </ul>
                    </section>
                    
                    {/* МЕСТО ВСТРЕЧИ */}
                    <section className="ExcursionPage__section ExcursionPage__meeting">
                        <h2>Место встречи</h2>
                        <p>Встречайте меня у главного входа Измайловского Кремля. Точное место встречи вы узнаете после внесения предоплаты.</p>
                    </section>
                    
                    {/* ОТЗЫВЫ */}
                    <section className="ExcursionPage__section ExcursionPage__reviews">
                        <h2>Отзывы посетителей</h2>
                        <div className="ExcursionPage__review-list">
                            {mockReviews.map(review => (
                                <div key={review.id} className="ReviewCard">
                                    <div className="ReviewCard__header">
                                        <img src={reviewAvatar} alt={review.name} className="ReviewCard__avatar" />
                                        <div>
                                            <p className="ReviewCard__name">{review.name}</p>
                                            <span className="ReviewCard__date">{review.date}</span>
                                        </div>
                                        <span className="ReviewCard__rating">{review.rating} ★</span>
                                    </div>
                                    <p className="ReviewCard__text">{review.text}</p>
                                </div>
                            ))}
                            <button className="ReviewCard__all-button">Показать все отзывы</button>
                        </div>
                    </section>
                </div>
                
                {/* ПРАВАЯ КОЛОНКА: ГИД и ДЕТАЛИ БРОНИРОВАНИЯ */}
                <div className="ExcursionPage__right-column">
                    
                    {/* БЛОК ГИДА */}
                    <div className="GuideBlock">
                        <div className="GuideBlock__header">
                             <img src={guideAvatar} alt={excursion.guide} className="GuideBlock__avatar" />
                             <div className="GuideBlock__meta">
                                 <p className="GuideBlock__name">{excursion.guide}</p>
                                 <span className="GuideBlock__status">345 посетили</span>
                                 <span className="GuideBlock__status">стаж 2 года</span>
                             </div>
                             <span className="GuideBlock__rating-value">9.7</span>
                        </div>
                        <p className="GuideBlock__greeting">Здравствуйте! Меня зовут {excursion.guide}. Гулять по городу, изучать его, проникать в его глубокую историю...</p>
                        <button className="GuideBlock__all-button">Все экскурсии гида</button>
                    </div>

                    {/* БЛОК ИНДИВИДУАЛЬНЫХ ДЕТАЛЕЙ */}
                    <div className="IndividualDetailsBlock">
                        <h4 className="IndividualDetailsBlock__title">Индивидуальная</h4>
                        <p>1-5 человек</p>
                        <p>{excursion.duration}</p>
                        <p>Пешком</p>
                        <p>Можно с детьми</p>
                    </div>
                </div>
            </div>

            {/* ДРУГИЕ ЭКСКУРСИИ */}
            <section className="ExcursionPage__similar">
                <h2 className="ExcursionPage__similar-title">Другие экскурсии в городе {excursion.city}</h2>
                <div className="ExcursionPage__similar-grid">
                    {mockSimilarExcursions.map(item => (
                        <div key={item.id} className="SimilarCard">
                             <img src="https://dummyimage.com/250x150/555/fff&text=Map" alt="Карта" className="SimilarCard__image" />
                            <h3 className="SimilarCard__title">{item.title}</h3>
                            <p className="SimilarCard__price">{item.price} ₽</p>
                            <span className="SimilarCard__rating">{item.rating} ★</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}