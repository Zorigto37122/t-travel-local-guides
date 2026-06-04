import { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext.jsx";
import { getMyBookings, cancelBooking } from "../../api/excursionsApi";
import BookingCard from "../../components/BookingCard/BookingCard";
import "./BookingsPage.css";

const BookingsPage = () => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

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

            const renderSection = (title, items) => items.length > 0 && (
              <div className="bookings-section">
                <h2 className="bookings-section-title">{title}</h2>
                <div className="bookings-list">
                  {items.map((b) => (
                    <BookingCard
                      key={b.booking_id}
                      booking={b}
                      onCancel={handleCancel}
                      cancelling={cancellingId === b.booking_id}
                    />
                  ))}
                </div>
              </div>
            );

            return (
              <>
                {renderSection("Активные бронирования", activeBookings)}
                {renderSection("Завершённые экскурсии", completedBookings)}
                {renderSection("Отменённые бронирования", cancelledBookings)}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default BookingsPage;
