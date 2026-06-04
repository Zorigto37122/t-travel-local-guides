import React from "react";
import { adminGetBookings } from "../../api/excursionsApi";
import { useAsync, SectionHeader, StateWrap, Badge } from "./adminShared";

const STATUS_META = {
  confirmed: { label: "Подтверждено", tone: "ok" },
  pending: { label: "Ожидает", tone: "accent" },
  completed: { label: "Завершено", tone: "info" },
  cancelled: { label: "Отменено", tone: "muted" },
};

function formatDate(value) {
  const d = new Date(value);
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminBookings({ token }) {
  const { data, loading, error } = useAsync(() => adminGetBookings(token), [token]);
  const bookings = data || [];

  return (
    <div>
      <SectionHeader title="Бронирования" count={bookings.length} />
      <StateWrap loading={loading} error={error} empty={bookings.length === 0} emptyText="Бронирований нет">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Экскурсия</th><th>Клиент</th><th>Дата</th><th>Чел.</th><th>Сумма</th><th>Статус</th><th>Оплата</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const meta = STATUS_META[b.status] || { label: b.status, tone: "neutral" };
                return (
                  <tr key={b.booking_id}>
                    <td className="adm-mono">{b.booking_id}</td>
                    <td className="adm-cell-title">{b.excursion_title}</td>
                    <td>
                      <div className="adm-userline adm-userline--stack">
                        <span>{b.client_name}</span>
                        <span className="adm-dim">{b.client_email}</span>
                      </div>
                    </td>
                    <td className="adm-nowrap">{formatDate(b.date)}</td>
                    <td>{b.number_of_people}</td>
                    <td className="adm-nowrap">{Number(b.total_amount).toLocaleString("ru-RU")} ₽</td>
                    <td><Badge tone={meta.tone}>{meta.label}</Badge></td>
                    <td>{b.payment_status === "paid"
                      ? <Badge tone="ok">Оплачено</Badge>
                      : <Badge tone="muted">Ожидает</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </StateWrap>
    </div>
  );
}
