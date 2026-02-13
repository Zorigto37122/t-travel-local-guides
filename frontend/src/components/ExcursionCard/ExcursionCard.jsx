import React from "react";
import './ExcursionCard.css';

const getNoun = (num, one, two, five) => {
    let n = Math.abs(num);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n==1) {
        return one;
    }
    if (n > 1 && n < 5) {
        return two;
    }
    return five;
}
const ExcursionCard = ({
    image,
    photos,
    type,
    duration,
    title,
    description,
    price,
    price_per_person,
    priceType,
    transport,
    country,
    city,
    guide,
    rating,
    reviewsCount,
    onBook,
    onCardClick
}) => {
    // Получаем первое фото из списка или используем image
    const getCardImage = () => {
        if (image) return image;
        if (!photos) return "https://dummyimage.com/400x350/f3f4f6/cccccc&text=Экскурсия";
        
        const photoArray = photos.split(',').filter(p => p.trim());
        if (photoArray.length === 0) return "https://dummyimage.com/400x350/f3f4f6/cccccc&text=Экскурсия";
        
        const firstPhoto = photoArray[0].trim();
        // Если это base64, используем как есть
        if (firstPhoto.startsWith('data:image')) {
            return firstPhoto;
        }
        // Если это полный URL, используем как есть
        if (firstPhoto.startsWith('http')) {
            return firstPhoto;
        }
        // Иначе добавляем базовый URL API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        return `${apiUrl}${firstPhoto}`;
    };
    
    const cardImage = getCardImage();
    const cardGuide = guide || {
        name: "Авторский гид",
        avatar: "https://dummyimage.com/40x40/ddd/555&text=G",
    };
    const cardRating = rating ?? "Новинка";
    const cardReviewsCount = typeof reviewsCount === "number" ? reviewsCount : 0;
    const cardPrice = price ?? price_per_person ?? 0;
    const cardPriceType = priceType || "с человека";
    const cardTransport = transport || (city && country ? `${city}, ${country}` : "");
    const cardDuration = duration || "По договорённости";
    const cardType = type || "Авторская";
    const cardDescription =
        description || (city && country ? `Экскурсия по городу ${city}, ${country}` : "Авторский маршрут от местного гида");

    const reviewsText = getNoun(cardReviewsCount, 'оценка', 'оценки', 'оценок')
    const handleRootClick = () => {
        if (onCardClick) {
            onCardClick();
        }
    };

    return (
        <div className="excursion-card" onClick={handleRootClick}>

            <div className="card-image-header">
                <img src={cardImage} alt={title} className="card-img" />

                <div className="card-overlay-top">
                    <span className="excursion-type">{cardType}</span>
                    <span className="excursion-duration">{cardDuration}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="guide-row">
                    <div className="guide-info">
                        <img src={cardGuide.avatar} className="guide-avatar" />
                        <span className="guide-name">{cardGuide.name}</span>
                    </div>

                    <div className="rating-info">
                        <span className="reviews-link">{cardReviewsCount} {reviewsText}</span>
                        <span className="rating-badge">{cardRating}</span>
                    </div>
                </div>

                <h3 className="card-title">{title}</h3>
                <p className="card-description">{cardDescription}</p>

                <div className="card-price-block">
                    <span className="price-amount">{cardPrice} ₽</span>
                    <span className="price-type"> {cardPriceType}</span>
                </div>

                <div className="card-transport">
                    {cardTransport}
                </div>

                {onBook && (
                    <button
                        className="card-book-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onBook();
                        }}
                    >
                        Забронировать
                    </button>
                )}
            </div>
        </div>
    );

};

export default ExcursionCard;