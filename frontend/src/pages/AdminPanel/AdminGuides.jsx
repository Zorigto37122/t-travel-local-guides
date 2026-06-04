import React from "react";
import { adminGetGuides } from "../../api/userApi";
import { useAsync, SectionHeader, StateWrap } from "./adminShared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function avatarUrl(photo) {
  if (!photo) return null;
  if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
  return `${API_URL}${photo}`;
}

export function AdminGuides({ token, navigate }) {
  const { data, loading, error } = useAsync(() => adminGetGuides(token), [token]);
  const guides = data || [];

  return (
    <div>
      <SectionHeader title="Гиды" count={guides.length} />
      <StateWrap loading={loading} error={error} empty={guides.length === 0} emptyText="Гидов нет">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Гид</th><th>Email</th><th>Телефон</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {guides.map((g) => {
                const url = avatarUrl(g.photo);
                return (
                  <tr key={g.guide_id}>
                    <td className="adm-mono">{g.guide_id}</td>
                    <td>
                      <div className="adm-userline">
                        {url
                          ? <img className="adm-ava" src={url} alt={g.user_name} />
                          : <span className="adm-ava adm-ava--ph">{g.user_name?.[0] || "Г"}</span>}
                        <span>{g.user_name}</span>
                      </div>
                    </td>
                    <td>{g.user_email}</td>
                    <td>{g.user_phone || "—"}</td>
                    <td>
                      <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => navigate(`/guides/${g.guide_id}`)}>
                        Профиль
                      </button>
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
