import React from "react";
import prosIcon from "../../assets/images/pros.svg";
import consIcon from "../../assets/images/cons.svg";
import { getRatingColor } from "../../utils/ratingColor";
import "./ReviewCard.css";

export default function ReviewCard({ clientName, subtitle, rating, pros, cons }) {
  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-card-meta">
          <strong className="review-card-name">{clientName}</strong>
          {subtitle && <span className="review-card-subtitle">{subtitle}</span>}
        </div>
        <span className="review-card-badge" style={{ background: getRatingColor(rating) }}>
          {rating}
        </span>
      </div>
      {pros && (
        <div className="review-card-pros">
          <img src={prosIcon} alt="+" className="review-icon" />
          {pros}
        </div>
      )}
      {cons && (
        <div className="review-card-cons">
          <img src={consIcon} alt="-" className="review-icon" />
          {cons}
        </div>
      )}
    </div>
  );
}
