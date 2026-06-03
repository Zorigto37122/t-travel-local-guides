import { Link } from "react-router-dom";
import "./CategoryNav.css";

const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
);

const HotelIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
  </svg>
);

const TrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 5.44.48 6 1H6c.56-.52 2.49-1 6-1zM7 9h4v4H7V9zm6 4V9h4v4h-4z"/>
  </svg>
);

const ToursIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.36.07-.74.07-1.08s-.03-.71-.07-1.08l2.54-1.9c.22-.17.28-.47.13-.71l-2.4-4.15c-.14-.25-.45-.33-.69-.25L16.16 5.5c-.56-.44-1.18-.79-1.84-1.06l-.38-2.81c-.03-.25-.25-.43-.5-.43h-4.76c-.25 0-.47.18-.5.43l-.38 2.81c-.66.27-1.28.62-1.84 1.06L4.12 4.34c-.25-.08-.55 0-.69.25L1.03 8.74c-.15.24-.09.54.13.71l2.54 1.9c-.04.37-.07.74-.07 1.08s.03.71.07 1.08l-2.54 1.9c-.22.17-.28.47-.13.71l2.4 4.15c.14.25.45.33.69.25l2.85-1.09c.56.44 1.18.79 1.84 1.06l.38 2.81c.03.25.25.43.5.43h4.76c.25 0 .47-.18.5-.43l.38-2.81c.66-.27 1.28-.62 1.84-1.06l2.85 1.09c.25.08.55 0 .69-.25l2.4-4.15c.15-.24.09-.54-.13-.71l-2.54-1.9z"/>
  </svg>
);

const BusIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const CATEGORIES = [
  { id: "avia", label: "Авиа", href: "#", Icon: PlaneIcon },
  { id: "hotels", label: "Отели", href: "#", Icon: HotelIcon },
  { id: "trains", label: "Поезда", href: "#", Icon: TrainIcon },
  { id: "tours", label: "Туры", href: "#", Icon: ToursIcon },
  { id: "buses", label: "Автобусы", href: "#", Icon: BusIcon },
  { id: "excursions", label: "Экскурсии", href: "/", active: true, Icon: PinIcon },
  { id: "orders", label: "Заказы", href: "/bookings", Icon: OrdersIcon },
];

export default function CategoryNav() {
  return (
    <nav className="CategoryNav">
      {CATEGORIES.map(({ id, label, href, active, Icon }) => (
        <Link
          key={id}
          to={href}
          className={`CategoryNav__item${active ? " CategoryNav__item--active" : ""}`}
        >
          <span className={`CategoryNav__icon${active ? " CategoryNav__icon--active" : ""}`}>
            <Icon />
          </span>
          <span className="CategoryNav__label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}