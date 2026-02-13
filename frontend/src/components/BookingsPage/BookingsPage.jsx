import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { getMyBookings, cancelBooking } from "../../api";
import { useNavigate } from "react-router-dom";
import "./BookingsPage.css";

const BookingsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Функция для корректного получения URL фото
  const getBookingPhoto = (photo) => {
    if (!photo) return "https://dummyimage.com/400x350/f3f4f6/cccccc&text=Нет+фото";

    if (photo.startsWith("data:image")) return photo; // base64
    if (photo.startsWith("http")) return photo; // полный URL

    // Относительный путь — добавляем базовый URL API
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${apiUrl}${photo}`;
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
      confirmed: "Подтверждено",
      pending: "Ожидает подтверждения",
      cancelled: "Отменено",
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      confirmed: "booking-status-confirmed",
      pending: "booking-status-pending",
      cancelled: "booking-status-cancelled",
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
            const activeBookings = bookings.filter(
              (b) => b.status === "confirmed" || b.status === "pending"
            );
            const cancelledBookings = bookings.filter(
              (b) => b.status === "cancelled"
            );

            const renderBookingCard = (booking) => (
              <div key={booking.booking_id} className="booking-card">
                <div className="booking-card-image">
                  {booking.excursion_photo ? (
                    <img
                      src={getBookingPhoto(booking.excursion_photo)}
                      alt={booking.excursion_title}
                    />
                  ) : (
                    <div className="booking-card-image-placeholder">
                      Нет фото
                    </div>
                  )}
                </div>

                <div className="booking-card-content">
                  <h2 className="booking-card-title">{booking.excursion_title}</h2>
                  <p className="booking-card-location">
                    {booking.excursion_city}, {booking.excursion_country}
                  </p>

                  <div className="booking-card-details">
                    <div className="booking-detail">
                      <span className="booking-detail-label">Дата и время:</span>
                      <span className="booking-detail-value">
                        {formatDate(booking.date)}
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="booking-detail-label">Количество человек:</span>
                      <span className="booking-detail-value">
                        {booking.number_of_people}
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="booking-detail-label">Цена за человека:</span>
                      <span className="booking-detail-value">
                        {booking.price_per_person} ₽
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="booking-detail-label">Итого:</span>
                      <span className="booking-detail-value booking-total">
                        {booking.total_amount} ₽
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="booking-detail-label">Статус:</span>
                      <span
                        className={`booking-detail-value ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  {booking.status !== "cancelled" && (
                    <button
                      className="booking-cancel-button"
                      onClick={() => handleCancel(booking.booking_id)}
                      disabled={cancellingId === booking.booking_id}
                    >
                      {cancellingId === booking.booking_id
                        ? "Отмена..."
                        : "Отменить бронирование"}
                    </button>
                  )}
                </div>
              </div>
            );

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
                {cancelledBookings.length > 0 && (
                  <div className="bookings-section">
                    <h2 className="bookings-section-title">
                      Отмененные бронирования
                    </h2>
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
