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
    type,
    duration,
    title,
    description,
    price,
    priceType,
    transport,
    guide,
    rating,
    reviewsCount
}) => {

    const reviewsText = getNoun(reviewsCount, 'оценка', 'оценки', 'оценок')
    return (
        <div className="excursion-card">

            <div className="card-image-header">
                <img src={image} alt={title} className="card-img" />

                <div className="card-overlay-top">
                    <span className="excursion-type">{type}</span>
                    <span className="excursion-duration">{duration}</span>
                </div>
            </div>

            <div className="card-body">
                <div className="guide-row">
                    <div className="guide-info">
                        <img src={guide.avatar} className="guide-avatar" />
                        <span className="guide-name">{guide.name}</span>
                    </div>

                    <div className="rating-info">
                        <span className="reviews-link">{reviewsCount} {reviewsText}</span>
                        <span className="rating-badge">{rating}</span>
                    </div>
                </div>

                <h3 className="card-title">{title}</h3>
                <p className="card-description">{description}</p>

                <div className="card-price-block">
                    <span className="price-amount">{price} ₽</span>
                    <span className="price-type"> {priceType}</span>
                </div>

                <div className="card-transport">
                    {transport}
                </div>

            </div>
        </div>
    );

};

export default ExcursionCard;