import React, { useState } from "react";
import { adminGetExcursions, adminSetExcursionStatus, adminDeleteExcursion } from "../../api/excursionsApi";
import { useAsync, SectionHeader, StateWrap, Badge } from "./adminShared";

const FILTERS = [
  { key: "", label: "Все" },
  { key: "pending_review", label: "На модерации" },
  { key: "approved", label: "Опубликованные" },
  { key: "draft", label: "Черновики" },
  { key: "rejected", label: "Отклонённые" },
];

const STATUS_META = {
  approved: { label: "Опубликована", tone: "ok" },
  pending_review: { label: "На модерации", tone: "accent" },
  draft: { label: "Черновик", tone: "muted" },
  rejected: { label: "Отклонена", tone: "danger" },
};

export function AdminExcursions({ token, navigate }) {
  const [filter, setFilter] = useState("");
  const { data, loading, error, setData } = useAsync(
    () => adminGetExcursions(token, filter || null),
    [token, filter]
  );
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const excursions = data || [];

  const applyStatus = async (id, status) => {
    setBusyId(id);
    setActionError(null);
    try {
      const updated = await adminSetExcursionStatus(token, id, status);
      // Если есть активный фильтр и статус больше не подходит — убираем из списка
      if (filter && updated.status !== filter) {
        setData((prev) => prev.filter((e) => e.excursion_id !== id));
      } else {
        setData((prev) => prev.map((e) => (e.excursion_id === id ? { ...e, ...updated } : e)));
      }
    } catch (e) {
      setActionError(e.message || "Не удалось изменить статус");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Удалить экскурсию безвозвратно?")) return;
    setBusyId(id);
    setActionError(null);
    try {
      await adminDeleteExcursion(token, id);
      setData((prev) => prev.filter((e) => e.excursion_id !== id));
    } catch (e) {
      setActionError(e.message || "Не удалось удалить экскурсию");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Экскурсии" count={excursions.length} />

      <div className="adm-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            className={`adm-tab${filter === f.key ? " adm-tab--active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && <div className="adm-state adm-state--error">{actionError}</div>}

      <StateWrap loading={loading} error={error} empty={excursions.length === 0} emptyText="Экскурсий нет">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Название</th><th>Город</th><th>Цена</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {excursions.map((ex) => {
                const meta = STATUS_META[ex.status] || { label: ex.status, tone: "neutral" };
                const isGroup = ex.price_type === "per_group";
                return (
                  <tr key={ex.excursion_id}>
                    <td className="adm-mono">{ex.excursion_id}</td>
                    <td className="adm-cell-title">{ex.title}</td>
                    <td>{ex.city}, {ex.country}</td>
                    <td className="adm-nowrap">
                      {Number(ex.price_per_person).toLocaleString("ru-RU")} ₽
                      <span className="adm-dim">{isGroup ? " / группа" : " / чел."}</span>
                    </td>
                    <td><Badge tone={meta.tone}>{meta.label}</Badge></td>
                    <td>
                      <div className="adm-row-actions">
                        {ex.status !== "approved" && (
                          <button className="adm-btn adm-btn--sm adm-btn--primary" disabled={busyId === ex.excursion_id} onClick={() => applyStatus(ex.excursion_id, "approved")}>
                            Одобрить
                          </button>
                        )}
                        {ex.status !== "rejected" && (
                          <button className="adm-btn adm-btn--sm adm-btn--ghost" disabled={busyId === ex.excursion_id} onClick={() => applyStatus(ex.excursion_id, "rejected")}>
                            Отклонить
                          </button>
                        )}
                        <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => navigate(`/excursions/${ex.excursion_id}`)}>
                          Открыть
                        </button>
                        <button className="adm-btn adm-btn--sm adm-btn--danger" disabled={busyId === ex.excursion_id} onClick={() => remove(ex.excursion_id)}>
                          Удалить
                        </button>
                      </div>
                    </td>
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
