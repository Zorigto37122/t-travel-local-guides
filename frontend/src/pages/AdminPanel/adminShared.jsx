import React, { useCallback, useEffect, useState } from "react";
import { translateError } from "../../api/userApi";

/** Загрузка данных раздела с состояниями loading/error и функцией reload. */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (e) {
      setError(translateError(e.message || "Не удалось загрузить данные"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, reload: run, setData };
}

/** Шапка раздела: заголовок + опциональные действия справа. */
export function SectionHeader({ title, count, children }) {
  return (
    <div className="adm-section-head">
      <h1 className="adm-section-title">
        {title}
        {count != null && <span className="adm-count">{count}</span>}
      </h1>
      {children && <div className="adm-section-actions">{children}</div>}
    </div>
  );
}

/** Обёртка для состояний загрузки / ошибки / пустого списка. */
export function StateWrap({ loading, error, empty, emptyText = "Ничего не найдено", children }) {
  if (loading) return <div className="adm-state">Загрузка…</div>;
  if (error) return <div className="adm-state adm-state--error">{error}</div>;
  if (empty) return <div className="adm-state">{emptyText}</div>;
  return children;
}

export function Badge({ tone = "neutral", children }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{children}</span>;
}
