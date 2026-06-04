import React, { useState } from "react";
import { adminGetPendingGuides, adminApproveGuide } from "../../api/userApi";
import { useAsync, SectionHeader, StateWrap } from "./adminShared";

export function AdminPending({ token }) {
  const { data, loading, error, setData } = useAsync(() => adminGetPendingGuides(token), [token]);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const pending = data || [];

  const decide = async (userId, approved) => {
    setBusyId(userId);
    setActionError(null);
    try {
      await adminApproveGuide(token, userId, approved);
      setData((prev) => prev.filter((p) => p.user_id !== userId));
    } catch (e) {
      setActionError(e.message || "Не удалось обработать заявку");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Заявки гидов" count={pending.length} />
      {actionError && <div className="adm-state adm-state--error">{actionError}</div>}
      <StateWrap loading={loading} error={error} empty={pending.length === 0} emptyText="Нет заявок на рассмотрении">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Имя</th><th>Email</th><th>Телефон</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.user_id}>
                  <td className="adm-mono">{p.user_id}</td>
                  <td>{p.user_name}</td>
                  <td>{p.user_email}</td>
                  <td>{p.user_phone || "—"}</td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-btn adm-btn--sm adm-btn--primary" disabled={busyId === p.user_id} onClick={() => decide(p.user_id, true)}>
                        Одобрить
                      </button>
                      <button className="adm-btn adm-btn--sm adm-btn--danger" disabled={busyId === p.user_id} onClick={() => decide(p.user_id, false)}>
                        Отклонить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateWrap>
    </div>
  );
}
