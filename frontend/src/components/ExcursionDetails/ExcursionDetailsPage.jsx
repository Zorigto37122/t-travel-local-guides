import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ExcursionDetailsPage.css";
import { getExcursionById, getAvailableDates, createBooking } from "../../api";
import { useAuth } from "../../AuthContext.jsx";

const ExcursionDetailsPage = () => {
  const { id } = useParams();
  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [people, setPeople] = useState(1);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [availableDates, setAvailableDates] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showBookingTab, setShowBookingTab] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExcursionById(id);
        setExcursion(data);
      } catch (e) {
        setError(e.message || "Не удалось загрузить экскурсию");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (excursion && people > 0) {
      loadAvailableDates();
    }
  }, [excursion, people]);

  const loadAvailableDates = async () => {
    if (!excursion) return;
    
    setLoadingDates(true);
    try {
      const data = await getAvailableDates(id, people);
      setAvailableDates(data);
    } catch (e) {
      console.error("Failed to load available dates:", e);
    } finally {
      setLoadingDates(false);
    }
  };

  const handlePeopleChange = (e) => {
    const newPeople = parseInt(e.target.value) || 1;
    setPeople(newPeople);
    setSelectedDate("");
    setSelectedTime("");
    setBookingMessage(null);
    setBookingError(null);
  };

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTime("");
    setBookingMessage(null);
    setBookingError(null);
  };

  const handleTimeSelect = (timeStr) => {
    setSelectedTime(timeStr);
    setBookingMessage(null);
    setBookingError(null);
  };

  const handleBook = async () => {
    if (!token) {
      setBookingError("Для бронирования нужно войти в личный кабинет");
      setBookingMessage(null);
      return;
    }
    
    if (!selectedDate) {
      setBookingError("Выберите дату для бронирования");
      setBookingMessage(null);
      return;
    }
    
    if (!selectedTime) {
      setBookingError("Выберите время для бронирования");
      setBookingMessage(null);
      return;
    }

    setBookingError(null);
    setBookingMessage(null);

    const dateTimeISO = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    try {
      console.log("Attempting to book:", { token: token ? "present" : "missing", excursionId: Number(id), dateTimeISO, people: Number(people) || 1 });
      
      const response = await createBooking({
        token,
        excursionId: Number(id),
        dateTimeISO,
        people: Number(people) || 1,
      });
      
      console.log("Booking successful:", response);
      setBookingMessage(response.message || "Экскурсия успешно забронирована");
      setSelectedDate("");
      setSelectedTime("");
      // Перезагружаем доступные даты после бронирования
      await loadAvailableDates();
    } catch (e) {
      console.error("Booking failed:", e);
      const errorMessage = e.message || "Не удалось забронировать экскурсию";
      
      if (errorMessage.includes("нет свободных мест") || errorMessage.includes("400")) {
        setBookingError("На выбранную дату и время нет свободных мест");
      } else if (errorMessage.includes("подключиться к серверу") || errorMessage.includes("Failed to fetch")) {
        setBookingError(`Ошибка подключения: ${errorMessage}. Убедитесь, что бэкенд запущен на порту 8000.`);
      } else {
        setBookingError(errorMessage);
      }
    }
  };

  // Группируем доступные слоты по датам
  const groupedSlots = React.useMemo(() => {
    if (!availableDates || !availableDates.time_slots) return {};
    
    const grouped = {};
    availableDates.time_slots.forEach((slot) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  }, [availableDates]);

  // Получаем доступные времена для выбранной даты
  const availableTimesForDate = React.useMemo(() => {
    if (!selectedDate || !groupedSlots[selectedDate]) return [];
    return groupedSlots[selectedDate].filter((slot) => slot.available);
  }, [selectedDate, groupedSlots]);

  if (loading) {
    return <div className="details-container">Загружаем экскурсию...</div>;
  }

  if (error) {
    return <div className="details-container">Ошибка: {error}</div>;
  }

  if (!excursion) {
    return <div className="details-container">Экскурсия не найдена</div>;
  }

  return (
    <div className="details-container">
      <div className="details-hero">
        <div className="details-image-wrapper">
          <img
            src={
              excursion.photos ||
              "https://dummyimage.com/900x400/f3f4f6/cccccc&text=Экскурсия"
            }
            alt={excursion.title}
          />
        </div>
        <div className="details-hero-text">
          <h1>{excursion.title}</h1>
          <p className="details-location">
            {excursion.city}, {excursion.country}
          </p>
          <p className="details-meta">
            Сложность маршрута: <strong>{excursion.difficulty}</strong>
          </p>
          <p className="details-price">
            от <strong>{excursion.price_per_person} ₽</strong> за человека
          </p>
        </div>
      </div>

      <div className="details-content">
        <div className="details-description">
          <h2>Описание экскурсии</h2>
          <p>{excursion.description || "Подробное описание экскурсии будет добавлено позже."}</p>
        </div>

        <div className="details-booking">
          <h2>Бронирование</h2>
          
          <label>
            Количество человек
            <input
              type="number"
              min="1"
              value={people}
              onChange={handlePeopleChange}
            />
          </label>

          {loadingDates ? (
            <p className="details-loading">Загружаем доступные даты...</p>
          ) : availableDates && Object.keys(groupedSlots).length > 0 ? (
            <>
              <div className="booking-dates-section">
                <h3>Выберите дату</h3>
                <div className="dates-grid">
                  {Object.keys(groupedSlots)
                    .sort()
                    .slice(0, 14) // Показываем первые 14 дней
                    .map((dateStr) => {
                      const slots = groupedSlots[dateStr];
                      const hasAvailable = slots.some((s) => s.available);
                      const dateObj = new Date(dateStr);
                      const dayName = dateObj.toLocaleDateString("ru-RU", { weekday: "short" });
                      const dayNumber = dateObj.getDate();
                      const monthName = dateObj.toLocaleDateString("ru-RU", { month: "short" });

                      return (
                        <button
                          key={dateStr}
                          className={`date-button ${selectedDate === dateStr ? "selected" : ""} ${!hasAvailable ? "disabled" : ""}`}
                          onClick={() => hasAvailable && handleDateSelect(dateStr)}
                          disabled={!hasAvailable}
                        >
                          <div className="date-day-name">{dayName}</div>
                          <div className="date-day-number">{dayNumber}</div>
                          <div className="date-month">{monthName}</div>
                          {!hasAvailable && <div className="date-unavailable">Нет мест</div>}
                        </button>
                      );
                    })}
                </div>
              </div>

              {selectedDate && availableTimesForDate.length > 0 && (
                <div className="booking-times-section">
                  <h3>Выберите время</h3>
                  <div className="times-grid">
                    {availableTimesForDate.map((slot) => (
                      <button
                        key={`${slot.date}_${slot.time}`}
                        className={`time-button ${selectedTime === slot.time ? "selected" : ""}`}
                        onClick={() => handleTimeSelect(slot.time)}
                      >
                        {slot.time}
                        {slot.available_slots !== null && (
                          <span className="time-slots-info">
                            {slot.available_slots} мест
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableTimesForDate.length === 0 && (
                <p className="details-error">На выбранную дату нет доступного времени</p>
              )}

              {selectedDate && selectedTime && (
                <div className="booking-summary">
                  <p className="booking-summary-text">
                    Выбрано: {new Date(selectedDate).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                    })} в {selectedTime}
                  </p>
                  <p className="booking-summary-price">
                    Итого: <strong>{excursion.price_per_person * people} ₽</strong>
                  </p>
                  <button className="details-book-button" onClick={handleBook}>
                    Забронировать
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="details-error">Нет доступных дат для бронирования</p>
          )}

          {bookingMessage && (
            <div className="booking-success-message">
              <p>✓ {bookingMessage}</p>
            </div>
          )}
          {bookingError && (
            <div className="booking-error-message">
              <p>✗ {bookingError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcursionDetailsPage;
