import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// ✅ Импортируем мок-функцию API
import { fetchExcursions } from '../../api_test/excursionsapi';

export default function SearchResultsPage() {
    // Получаем параметры из URL (?city=Москва&persons=2)
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Получаем значения для запроса
    const city = searchParams.get('city') || 'все города';
    const persons = searchParams.get('people') || 1; // Используем 'people' из SearchPage

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Имитируем запрос к API
                const data = await fetchExcursions({ city, persons });
                setResults(data);
            } catch (err) {
                console.error("Ошибка при загрузке экскурсий:", err);
                setError("Не удалось загрузить результаты поиска.");
            } finally {
                setIsLoading(false);
            }
        };
        loadResults();
    }, [city, persons]);

    // Обработчик клика по карточке экскурсии
    const handleExcursionClick = (excursionId) => {
        // Переходим на страницу деталей: /excursion/101
        navigate(`/excursion/${excursionId}`);
    };

    // --- Отображение состояний ---
    if (isLoading) {
        return <div className="SearchResultsPage__loading">Загрузка экскурсий в {city}...</div>;
    }
    
    if (error) {
        return <div className="SearchResultsPage__error">{error}</div>;
    }

    const resultCount = results.length;

    return (
        <div className="SearchResultsPage">
            <h1 className="SearchResultsPage__title">
                {resultCount ? `Найдено ${resultCount} экскурсий в ${city}` : `Экскурсий в ${city} не найдено`}
            </h1>
            
            {resultCount > 0 && (
                <div className="ResultsList">
                    {results.map(excursion => (
                        <div 
                            key={excursion.id} 
                            className="ExcursionCard"
                            onClick={() => handleExcursionClick(excursion.id)}
                        >
                            <h3 className="ExcursionCard__title">{excursion.title}</h3>
                            <p className="ExcursionCard__duration">
                                Длительность: **{excursion.duration}**
                            </p>
                            <p className="ExcursionCard__price">
                                Цена: от **{excursion.price} ₽**
                            </p>
                            <button className="ExcursionCard__button">Подробнее</button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Дополнительный контент или рекомендации */}
        </div>
    );
}