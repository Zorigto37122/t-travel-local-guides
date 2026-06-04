import React, { useState } from "react";
import { adminGetUsers, adminUpdateUser } from "../../api/userApi";
import { useAsync, SectionHeader, StateWrap, Badge } from "./adminShared";

export function AdminUsers({ token }) {
  const { data, loading, error, setData } = useAsync(() => adminGetUsers(token), [token]);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const users = data || [];

  const toggle = async (user, field) => {
    setBusyId(user.id);
    setActionError(null);
    try {
      const updated = await adminUpdateUser(token, user.id, { [field]: !user[field] });
      setData((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (e) {
      setActionError(e.message || "Не удалось обновить пользователя");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Пользователи" count={users.length} />
      {actionError && <div className="adm-state adm-state--error">{actionError}</div>}
      <StateWrap loading={loading} error={error} empty={users.length === 0} emptyText="Пользователей нет">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>Имя</th><th>Email</th><th>Телефон</th><th>Роли</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="adm-mono">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <div className="adm-badges">
                      {u.is_superuser && <Badge tone="accent">Админ</Badge>}
                      {u.is_guide && <Badge tone="info">Гид</Badge>}
                      {u.is_active ? <Badge tone="ok">Активен</Badge> : <Badge tone="muted">Отключён</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-btn adm-btn--sm adm-btn--ghost" disabled={busyId === u.id} onClick={() => toggle(u, "is_guide")}>
                        {u.is_guide ? "Снять гида" : "Сделать гидом"}
                      </button>
                      <button className="adm-btn adm-btn--sm adm-btn--ghost" disabled={busyId === u.id} onClick={() => toggle(u, "is_superuser")}>
                        {u.is_superuser ? "Снять админа" : "Сделать админом"}
                      </button>
                      <button className="adm-btn adm-btn--sm adm-btn--ghost" disabled={busyId === u.id} onClick={() => toggle(u, "is_active")}>
                        {u.is_active ? "Отключить" : "Включить"}
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
