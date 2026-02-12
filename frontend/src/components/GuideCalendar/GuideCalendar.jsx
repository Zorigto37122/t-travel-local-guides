import React, { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { getGuideBookings, translateError } from "../../api";
import { useNavigate } from "react-router-dom";
import "./GuideCalendar.css";

const GuideCalendar = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    loadBookings();
  }, [token]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getGuideBookings(token);
      setBookings(data);
    } catch (err) {
      setError(translateError(err.message || "Не удалось загрузить бронирования"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#00C853";
      case "pending":
        return "#FF9800";
      case "cancelled":
        return "#999";
      default:
        return "#666";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Подтверждено";
      case "pending":
        return "Ожидает подтверждения";
      case "cancelled":
        return "Отменено";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="guide-calendar-container">Загрузка...</div>;
  }

  return (
    <div className="guide-calendar-container">
      <div className="guide-calendar-header">
        <h1 className="guide-calendar-title">Календарь бронирований</h1>
        <button
          className="guide-calendar-back-btn"
          onClick={() => navigate("/guide/dashboard")}
        >
          ← Назад к кабинету
        </button>
      </div>

      {error && <div className="guide-calendar-error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="guide-calendar-empty">
          <p>У вас пока нет бронирований</p>
        </div>
      ) : (
        <div className="guide-calendar-list">
          {bookings.map((booking) => (
            <div key={booking.booking_id} className="guide-calendar-booking">
              <div className="guide-calendar-booking-main">
                <div className="guide-calendar-booking-info">
                  <h3 className="guide-calendar-excursion-title">
                    {booking.excursion_title}
                  </h3>
                  <div className="guide-calendar-booking-details">
                    <p className="guide-calendar-date">
                      <strong>Дата и время:</strong> {formatDate(booking.date)}
                    </p>
                    <p className="guide-calendar-people">
                      <strong>Количество человек:</strong> {booking.number_of_people}
                    </p>
                    <p className="guide-calendar-status">
                      <strong>Статус:</strong>{" "}
                      <span style={{ color: getStatusColor(booking.status) }}>
                        {getStatusText(booking.status)}
                      </span>
                    </p>
                    <p className="guide-calendar-payment">
                      <strong>Оплата:</strong>{" "}
                      {booking.payment_status === "paid" ? "Оплачено" : "Ожидает оплаты"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="guide-calendar-client-info">
                <h4>Контактная информация клиента:</h4>
                <div className="guide-calendar-client-details">
                  <p>
                    <strong>Имя:</strong> {booking.client_name}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href={`mailto:${booking.client_email}`}>{booking.client_email}</a>
                  </p>
                  {booking.client_phone && (
                    <p>
                      <strong>Телефон:</strong>{" "}
                      <a href={`tel:${booking.client_phone}`}>{booking.client_phone}</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuideCalendar;
