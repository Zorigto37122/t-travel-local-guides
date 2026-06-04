import React from "react";
import './ExcursionCard.css';
import { getRatingColor } from '../../utils/ratingColor';

const getNoun = (num, one, two, five) => {
    const n = Math.abs(num) % 100;
    if (n >= 5 && n <= 20) return five;
    const m = n % 10;
    if (m === 1) return one;
    if (m > 1 && m < 5) return two;
    return five;
};

const ClockIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
        <path d="M7.5 3a.5.5 0 01.5.5v4.75l2.9 1.45a.5.5 0 01-.45.9l-3.15-1.575A.5.5 0 017 8.5V3.5a.5.5 0 01.5-.5z"/>
    </svg>
);

const ExcursionCard = ({
    image,
    photos,
    type,
    duration,
    title,
    short_description,
    description,
    price,
    price_per_person,
    price_type,
    priceType,
    available_slots,
    transport,
    country,
    city,
    guide,
    rating,
    reviewsCount,
    onBook,
    onCardClick,
}) => {
    const getCardImage = () => {
        if (image) return image;
        if (!photos) return null;
        const photoArray = photos.split(',').filter(p => p.trim());
        if (photoArray.length === 0) return null;
        const first = photoArray[0].trim();
        if (first.startsWith('data:image') || first.startsWith('http')) return first;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${first}`;
    };

    const cardImage = getCardImage();
    const cardGuide = guide || { name: "Авторский гид", avatar: null };
    const getAvatarUrl = (avatar) => {
        if (!avatar) return null;
        if (avatar.startsWith('data:') || avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${avatar}`;
    };
    const avatarUrl = getAvatarUrl(cardGuide.avatar);
    const hasRating = rating !== null && rating !== undefined;
    const cardReviewsCount = typeof reviewsCount === "number" ? reviewsCount : 0;
    const cardPrice = price ?? price_per_person ?? 0;
    const isGroupPrice = (price_type || priceType) === "per_group";
    const cardPriceType = isGroupPrice
        ? `за группу${available_slots ? ` до ${available_slots} чел.` : ""}`
        : (priceType || "с человека");
    const cardTransport = transport || "";
    const cardDuration = duration || null;
    const cardType = type || null;
    const cardDescription = short_description || (city && country ? `Экскурсия по ${city}, ${country}` : "");
    const reviewsText = getNoun(cardReviewsCount, 'оценка', 'оценки', 'оценок');

    return (
        <div className="excursion-card" onClick={onCardClick}>

            <div className="card-image-header">
                {cardImage ? (
                    <img src={cardImage} alt={title} className="card-img" />
                ) : (
                    <div className="card-img card-img--placeholder" />
                )}

                <div className="card-overlay-top">
                    {cardType && (
                        <span className="badge-type">{cardType}</span>
                    )}
                    {cardDuration && (
                        <span className="badge-duration">
                            <ClockIcon />
                            {cardDuration}
                        </span>
                    )}
                </div>
            </div>

            <div className="card-body">
                <div className="guide-row">
                    <div className="guide-info">
                        {avatarUrl ? (
                            <img src={avatarUrl} className="guide-avatar" alt="" />
                        ) : (
                            <div className="guide-avatar guide-avatar--placeholder" />
                        )}
                        <span className="guide-name">{cardGuide.name}</span>
                    </div>

                    <div className="rating-info">
                        {cardReviewsCount > 0 && (
                            <span className="reviews-link">
                                {cardReviewsCount} {reviewsText}
                            </span>
                        )}
                        {hasRating && (
                            <span className="rating-badge" style={{ background: getRatingColor(rating) }}>{rating}</span>
                        )}
                    </div>
                </div>

                <h3 className="card-title">{title}</h3>

                {cardDescription && (
                    <p className="card-description">{cardDescription}</p>
                )}

                <div className="card-price-block">
                    <span className="price-amount">{Number(cardPrice).toLocaleString('ru-RU')} ₽</span>
                    <span className="price-type"> {cardPriceType}</span>
                </div>

                {cardTransport && (
                    <div className="card-transport">{cardTransport}</div>
                )}

                {onBook && (
                    <button
                        className="card-book-button"
                        onClick={(e) => { e.stopPropagation(); onBook(); }}
                    >
                        Забронировать
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExcursionCard;
