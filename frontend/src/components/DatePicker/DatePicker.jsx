import { useState, useRef, useEffect } from "react";
import "./DatePicker.css";

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekDay(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // понедельник = 0
}
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function DatePicker({ value, onChange, placeholder = "Дата" }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value).getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value).getMonth() : new Date().getMonth()));
  const wrapRef = useRef(null);

  useEffect(() => {
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Сравнение по компонентам даты — без зависимости от timezone/timestamp
  const isBeforeToday = (y, m, d) => {
    const now = new Date();
    const ty = now.getFullYear();
    const tm = now.getMonth();
    const td = now.getDate();
    if (y < ty) return true;
    if (y === ty && m < tm) return true;
    if (y === ty && m === tm && d < td) return true;
    return false;
  };

  const isToday = (y, m, d) => {
    const now = new Date();
    return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  };

  const handleDayClick = (day) => {
    if (isBeforeToday(viewYear, viewMonth, day)) return;
    onChange(toISO(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstWeekDay(viewYear, viewMonth);
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const selDate = value ? new Date(value + "T00:00:00") : null;

  return (
    <div className="DatePicker" ref={wrapRef}>
      <input
        type="text"
        readOnly
        value={formatDisplay(value)}
        placeholder={placeholder}
        className="DatePicker__input"
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div className="DatePicker__popup">
          <div className="DatePicker__header">
            <button className="DatePicker__nav" onClick={prevMonth} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="DatePicker__month-label">
              {MONTHS_RU[viewMonth]} {viewYear}
            </span>
            <button className="DatePicker__nav" onClick={nextMonth} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="DatePicker__grid">
            {DAYS_RU.map((d) => (
              <div key={d} className="DatePicker__weekday">{d}</div>
            ))}

            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="DatePicker__empty" />;

              const past = isBeforeToday(viewYear, viewMonth, day);
              const todayDay = isToday(viewYear, viewMonth, day);
              const selected =
                selDate &&
                selDate.getFullYear() === viewYear &&
                selDate.getMonth() === viewMonth &&
                selDate.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  className={[
                    "DatePicker__day",
                    past ? "DatePicker__day--past" : "",
                    todayDay && !selected ? "DatePicker__day--today" : "",
                    selected ? "DatePicker__day--selected" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => handleDayClick(day)}
                  disabled={past}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
