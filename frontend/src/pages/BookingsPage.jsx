import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext.jsx";
import { getMyBookings, cancelBooking } from "../api/excursionsApi";
import { useNavigate } from "react-router-dom";
import "./BookingsPage.css";

const BookingsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Берём первое фото из comma-separated строки и строим URL
  const getBookingPhoto = (photo) => {
    if (!photo) return null;
    const first = photo.split(",")[0].trim();
    if (!first) return null;
    if (first.startsWith("data:image") || first.startsWith("http")) return first;
    return `${apiUrl}${first}`;
  };

  useEffect(() => {
    if (!user || !token) return;

    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyBookings(token);
        setBookings(data);
      } catch (err) {
        setError(err.message || "Не удалось загрузить бронирования");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user, token]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Вы уверены, что хотите отменить это бронирование?")) return;

    setCancellingId(bookingId);
    try {
      const updatedBooking = await cancelBooking(token, bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.booking_id === bookingId ? updatedBooking : b))
      );
    } catch (err) {
      alert(err.message || "Не удалось отменить бронирование");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed:  "Подтверждено",
      pending:    "Ожидает подтверждения",
      cancelled:  "Отменено",
      completed:  "Завершено",
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      confirmed:  "booking-status-confirmed",
      pending:    "booking-status-pending",
      cancelled:  "booking-status-cancelled",
      completed:  "booking-status-completed",
    };
    return classes[status] || "";
  };

  if (!user) {
    return (
      <div className="bookings-container">
        <p>Пожалуйста, войдите в систему</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bookings-container">
        <p>Загрузка бронирований...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings-container">
        <p className="bookings-error">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <h1 className="bookings-title">Мои бронирования</h1>

      {bookings.length === 0 ? (
        <div className="bookings-empty">
          <p>У вас пока нет бронирований</p>
          <button
            className="bookings-empty-button"
            onClick={() => navigate("/search")}
          >
            Найти экскурсии
          </button>
        </div>
      ) : (
        <>
          {(() => {
            const activeBookings    = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
            const completedBookings = bookings.filter((b) => b.status === "completed");
            const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

            const renderBookingCard = (booking) => {
              const photoUrl = getBookingPhoto(booking.excursion_photo);
              const goToExcursion = () => navigate(`/excursions/${booking.excursion_id}`);
              return (
                <div key={booking.booking_id} className="booking-card">
                  <div className="booking-card-image" onClick={goToExcursion} style={{ cursor: "pointer" }}>
                    {photoUrl
                      ? <img src={photoUrl} alt={booking.excursion_title} />
                      : <div className="booking-card-image-placeholder">Нет фото</div>
                    }
                  </div>
                  <div className="booking-card-content">
                    <h2 className="booking-card-title booking-card-title--link" onClick={goToExcursion}>
                      {booking.excursion_title}
                      <span className="booking-card-arrow"> →</span>
                    </h2>
                    <p className="booking-card-location">{booking.excursion_city}, {booking.excursion_country}</p>
                    <div className="booking-card-details">
                      <div className="booking-detail">
                        <span className="booking-detail-label">Дата и время:</span>
                        <span className="booking-detail-value">{formatDate(booking.date)}</span>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-label">Количество человек:</span>
                        <span className="booking-detail-value">{booking.number_of_people}</span>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-label">Цена за человека:</span>
                        <span className="booking-detail-value">{booking.price_per_person} ₽</span>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-label">Итого:</span>
                        <span className="booking-detail-value booking-total">{booking.total_amount} ₽</span>
                      </div>
                      <div className="booking-detail">
                        <span className="booking-detail-label">Статус:</span>
                        <span className={`booking-detail-value ${getStatusClass(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                    </div>
                    {booking.status !== "cancelled" && booking.status !== "completed" && (
                      <button
                        className="booking-cancel-button"
                        onClick={() => handleCancel(booking.booking_id)}
                        disabled={cancellingId === booking.booking_id}
                      >
                        {cancellingId === booking.booking_id ? "Отмена..." : "Отменить бронирование"}
                      </button>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <>
                {activeBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2 className="bookings-section-title">
                      Активные бронирования
                    </h2>
                    <div className="bookings-list">
                      {activeBookings.map(renderBookingCard)}
                    </div>
                  </div>
                )}
                {completedBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2 className="bookings-section-title">Завершённые экскурсии</h2>
                    <div className="bookings-list">
                      {completedBookings.map(renderBookingCard)}
                    </div>
                  </div>
                )}
                {cancelledBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2 className="bookings-section-title">Отменённые бронирования</h2>
                    <div className="bookings-list">
                      {cancelledBookings.map(renderBookingCard)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default BookingsPage;
