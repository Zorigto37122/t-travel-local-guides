import React from "react";
import { useNavigate } from "react-router-dom";
import "./BookingCard.css";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const STATUS_LABELS = {
  confirmed: "Подтверждено",
  pending: "Ожидает подтверждения",
  cancelled: "Отменено",
  completed: "Завершено",
};

const STATUS_CLASSES = {
  confirmed: "booking-status-confirmed",
  pending: "booking-status-pending",
  cancelled: "booking-status-cancelled",
  completed: "booking-status-completed",
};

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPhotoUrl(photo) {
  if (!photo) return null;
  const first = photo.split(",")[0].trim();
  if (!first) return null;
  if (first.startsWith("http") || first.startsWith("data:")) return first;
  return `${API_URL}${first}`;
}

export default function BookingCard({ booking, onCancel, cancelling }) {
  const navigate = useNavigate();
  const photo = getPhotoUrl(booking.excursion_photo || booking.excursion_photos || booking.photo);
  const statusLabel = STATUS_LABELS[booking.status] || booking.status;
  const statusClass = STATUS_CLASSES[booking.status] || "";
  const canCancel = booking.status === "confirmed" || booking.status === "pending";
  const city = booking.excursion_city || booking.city;
  const country = booking.excursion_country || booking.country;
  const people = booking.number_of_people || booking.people || booking.num_people || 1;
  const total = booking.total_amount ?? booking.total_price;

  return (
    <div className="booking-card">
      {photo && (
        <img
          src={photo}
          alt={booking.excursion_title}
          className="booking-card-image"
          onClick={() => navigate(`/excursions/${booking.excursion_id}`)}
        />
      )}
      <div className="booking-card-content">
        <div
          className="booking-card-title booking-card-title--link"
          onClick={() => navigate(`/excursions/${booking.excursion_id}`)}
        >
          {booking.excursion_title}
          <span className="booking-card-arrow">→</span>
        </div>
        {(city || country) && (
          <div className="booking-card-location">
            {[city, country].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="booking-card-details">
          <div className="booking-detail">
            <span className="booking-detail-label">Дата</span>
            <span className="booking-detail-value">{formatDate(booking.booked_date || booking.date)}</span>
          </div>
          <div className="booking-detail">
            <span className="booking-detail-label">Гостей</span>
            <span className="booking-detail-value">{people}</span>
          </div>
          {total != null && (
            <div className="booking-total">
              {Number(total).toLocaleString("ru-RU")} ₽
            </div>
          )}
        </div>
        <div className={`booking-status ${statusClass}`}>{statusLabel}</div>
        {canCancel && (
          <button
            className="booking-cancel-button"
            onClick={() => onCancel(booking.booking_id)}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить"}
          </button>
        )}
      </div>
    </div>
  );
}
