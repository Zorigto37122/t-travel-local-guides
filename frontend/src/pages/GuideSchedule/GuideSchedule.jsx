import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../AuthContext.jsx";
import { getExcursionById, getExcursionSchedule, saveExcursionSchedule } from "../../api/excursionsApi";
import { translateError } from "../../api/userApi";
import "./GuideSchedule.css";

function formatTimeInput(raw) {
  // оставляем только цифры, автоматически вставляем двоеточие после 2-й цифры
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(t) {
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return !!m;
}

const WEEKDAYS = [
  { idx: 0, short: "Пн", long: "Понедельник" },
  { idx: 1, short: "Вт", long: "Вторник" },
  { idx: 2, short: "Ср", long: "Среда" },
  { idx: 3, short: "Чт", long: "Четверг" },
  { idx: 4, short: "Пт", long: "Пятница" },
  { idx: 5, short: "Сб", long: "Суббота" },
  { idx: 6, short: "Вс", long: "Воскресенье" },
];

function formatRuDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
}

export default function GuideSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Недельный шаблон
  const [weekdays, setWeekdays] = useState(() => new Set());
  const [templateTimes, setTemplateTimes] = useState([]);
  const [templateCapacity, setTemplateCapacity] = useState("");
  const [newTime, setNewTime] = useState("10:00");

  // Разовые даты
  const [extraSlots, setExtraSlots] = useState([]); // [{date, time, capacity}]
  const [newExtraDate, setNewExtraDate] = useState("");
  const [newExtraTime, setNewExtraTime] = useState("10:00");

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [exc, schedule] = await Promise.all([
          getExcursionById(id),
          getExcursionSchedule(token, id),
        ]);
        if (!mounted) return;
        setExcursion(exc);
        // Восстанавливаем недельный шаблон из плоского списка правил
        const wd = new Set((schedule.availability || []).map((r) => r.weekday));
        const times = [...new Set((schedule.availability || []).map((r) => r.time))].sort();
        const cap = (schedule.availability || [])[0]?.capacity;
        setWeekdays(wd);
        setTemplateTimes(times);
        setTemplateCapacity(cap != null ? String(cap) : "");
        setExtraSlots(
          (schedule.extra_slots || [])
            .map((s) => ({ date: s.date, time: s.time, capacity: s.capacity }))
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        );
      } catch (e) {
        if (mounted) setError(translateError(e.message || "Не удалось загрузить расписание"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, token]);

  const toggleWeekday = (idx) => {
    setSaved(false);
    setWeekdays((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const addTemplateTime = () => {
    if (!newTime) return;
    setSaved(false);
    setTemplateTimes((prev) => (prev.includes(newTime) ? prev : [...prev, newTime].sort()));
  };

  const removeTemplateTime = (t) => {
    setSaved(false);
    setTemplateTimes((prev) => prev.filter((x) => x !== t));
  };

  const addExtraSlot = () => {
    if (!newExtraDate || !newExtraTime) return;
    setSaved(false);
    setExtraSlots((prev) => {
      if (prev.some((s) => s.date === newExtraDate && s.time === newExtraTime)) return prev;
      const cap = templateCapacity ? parseInt(templateCapacity, 10) : null;
      return [...prev, { date: newExtraDate, time: newExtraTime, capacity: cap }]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    });
  };

  const removeExtraSlot = (date, time) => {
    setSaved(false);
    setExtraSlots((prev) => prev.filter((s) => !(s.date === date && s.time === time)));
  };

  const buildAvailability = () => {
    const cap = templateCapacity ? parseInt(templateCapacity, 10) : null;
    const rules = [];
    [...weekdays].forEach((wd) => {
      templateTimes.forEach((t) => rules.push({ weekday: wd, time: t, capacity: cap }));
    });
    return rules;
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    // Валидация: если выбраны дни, нужно хотя бы одно время
    if (weekdays.size > 0 && templateTimes.length === 0) {
      setError("Добавьте хотя бы одно время для выбранных дней недели");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        availability: buildAvailability(),
        extra_slots: extraSlots.map((s) => ({
          date: s.date,
          time: s.time,
          capacity: s.capacity ?? (templateCapacity ? parseInt(templateCapacity, 10) : null),
        })),
      };
      await saveExcursionSchedule(token, id, payload);
      setSaved(true);
    } catch (e) {
      setError(translateError(e.message || "Не удалось сохранить расписание"));
    } finally {
      setSaving(false);
    }
  };

  const totalWeekly = weekdays.size * templateTimes.length;
  const hasSchedule = totalWeekly > 0 || extraSlots.length > 0;

  if (loading) return <div className="gsch-loading">Загружаем расписание…</div>;

  return (
    <div className="gsch-page">
      <div className="gsch-container">
        <button className="gsch-back" onClick={() => navigate("/guide/dashboard")}>← К моим экскурсиям</button>

        <div className="gsch-header">
          <h1 className="gsch-title">Расписание</h1>
          <p className="gsch-subtitle">{excursion?.title}</p>
          <p className="gsch-hint">
            Укажите, когда вы готовы проводить экскурсию. Клиенты смогут бронировать только выбранные дни и время.
            {excursion?.available_slots != null
              ? ` Мест по умолчанию: ${excursion.available_slots}.`
              : " Если число мест не задано — без ограничения."}
          </p>
        </div>

        {error && <div className="gsch-error">{error}</div>}

        {/* ── Недельный шаблон ── */}
        <section className="gsch-card">
          <h2 className="gsch-card-title">Повторять по дням недели</h2>
          <p className="gsch-card-desc">Слоты автоматически создаются на 30 дней вперёд.</p>

          <div className="gsch-weekdays">
            {WEEKDAYS.map((w) => (
              <button
                key={w.idx}
                type="button"
                className={`gsch-chip${weekdays.has(w.idx) ? " gsch-chip--active" : ""}`}
                onClick={() => toggleWeekday(w.idx)}
                title={w.long}
              >
                {w.short}
              </button>
            ))}
          </div>

          <div className="gsch-times-block">
            <span className="gsch-label">Время</span>
            <div className="gsch-times">
              {templateTimes.length === 0 && <span className="gsch-empty-inline">Время не добавлено</span>}
              {templateTimes.map((t) => (
                <span key={t} className="gsch-time-pill">
                  {t}
                  <button type="button" className="gsch-time-remove" onClick={() => removeTemplateTime(t)} aria-label="Удалить">×</button>
                </span>
              ))}
            </div>
            <div className="gsch-add-row">
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(formatTimeInput(e.target.value))}
                placeholder="ЧЧ:ММ"
                maxLength={5}
                className={`gsch-input gsch-input--time${newTime && !isValidTime(newTime) ? " gsch-input--invalid" : ""}`}
              />
              <button type="button" className="gsch-add-btn" onClick={addTemplateTime} disabled={!isValidTime(newTime)}>
                + Добавить время
              </button>
            </div>
          </div>

          <div className="gsch-capacity-block">
            <label className="gsch-label" htmlFor="gsch-cap">Мест на слот</label>
            <input
              id="gsch-cap"
              type="number"
              min="1"
              value={templateCapacity}
              onChange={(e) => { setSaved(false); setTemplateCapacity(e.target.value); }}
              placeholder={excursion?.available_slots != null ? String(excursion.available_slots) : "Без ограничения"}
              className="gsch-input gsch-input--num"
            />
            <span className="gsch-help">Оставьте пустым, чтобы использовать число мест экскурсии.</span>
          </div>
        </section>

        {/* ── Разовые даты ── */}
        <section className="gsch-card">
          <h2 className="gsch-card-title">Разовые даты</h2>
          <p className="gsch-card-desc">Дополнительные конкретные дата и время, вне недельного шаблона.</p>

          <div className="gsch-add-row gsch-add-row--extra">
            <input
              type="date"
              min={todayIso}
              value={newExtraDate}
              onChange={(e) => setNewExtraDate(e.target.value)}
              className="gsch-input gsch-input--date"
            />
            <input
              type="text"
              value={newExtraTime}
              onChange={(e) => setNewExtraTime(formatTimeInput(e.target.value))}
              placeholder="ЧЧ:ММ"
              maxLength={5}
              className={`gsch-input gsch-input--time${newExtraTime && !isValidTime(newExtraTime) ? " gsch-input--invalid" : ""}`}
            />
            <button type="button" className="gsch-add-btn" onClick={addExtraSlot} disabled={!newExtraDate || !isValidTime(newExtraTime)}>+ Добавить дату</button>
          </div>

          {extraSlots.length > 0 ? (
            <div className="gsch-extra-list">
              {extraSlots.map((s) => (
                <div key={`${s.date}_${s.time}`} className="gsch-extra-item">
                  <span className="gsch-extra-date">{formatRuDate(s.date)}</span>
                  <span className="gsch-extra-time">{s.time}</span>
                  <button type="button" className="gsch-extra-remove" onClick={() => removeExtraSlot(s.date, s.time)} aria-label="Удалить">×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="gsch-empty">Разовых дат пока нет</p>
          )}
        </section>

        {/* ── Footer / save ── */}
        <div className="gsch-footer">
          <div className="gsch-summary">
            {hasSchedule
              ? `Недельных слотов: ${totalWeekly} · разовых: ${extraSlots.length}`
              : "Расписание пустое — клиенты увидят стандартные слоты"}
          </div>
          <div className="gsch-footer-actions">
            {saved && <span className="gsch-saved">✓ Сохранено</span>}
            <button className="gsch-save" onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить расписание"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
