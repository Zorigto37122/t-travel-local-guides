import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FavoritesPage.css";
import ExcursionCard from "../components/ExcursionCard/ExcursionCard";
import { getFavorites, removeFavorite } from "../api/excursionsApi";
import { useAuth } from "../AuthContext";

const SORT_OPTIONS = [
  { value: "added",   label: "По дате добавления" },
  { value: "rating",  label: "По рейтингу" },
  { value: "price_asc",  label: "Цена: сначала дешевле" },
  { value: "price_desc", label: "Цена: сначала дороже" },
];

export default function FavoritesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null);

  const [filterCountry, setFilterCountry] = useState("Все страны");
  const [filterCity,    setFilterCity]    = useState("Все города");
  const [filterFormat,  setFilterFormat]  = useState("Все форматы");
  const [sortBy,        setSortBy]        = useState("added");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getFavorites(token)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Reset city when country changes
  useEffect(() => { setFilterCity("Все города"); }, [filterCountry]);

  // Derived filter options
  const countries = useMemo(
    () => ["Все страны", ...new Set(favorites.map((ex) => ex.country).filter(Boolean))],
    [favorites]
  );
  const cities = useMemo(() => {
    const pool = filterCountry === "Все страны"
      ? favorites
      : favorites.filter((ex) => ex.country === filterCountry);
    return ["Все города", ...new Set(pool.map((ex) => ex.city).filter(Boolean))];
  }, [favorites, filterCountry]);
  const formats = useMemo(
    () => ["Все форматы", ...new Set(favorites.map((ex) => ex.difficulty).filter(Boolean))],
    [favorites]
  );

  const filtered = useMemo(() => {
    let list = [...favorites];
    if (filterCountry !== "Все страны") list = list.filter((ex) => ex.country === filterCountry);
    if (filterCity    !== "Все города")  list = list.filter((ex) => ex.city    === filterCity);
    if (filterFormat  !== "Все форматы") list = list.filter((ex) => ex.difficulty === filterFormat);

    switch (sortBy) {
      case "rating":     list.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0)); break;
      case "price_asc":  list.sort((a, b) => (a.price_per_person ?? 0) - (b.price_per_person ?? 0)); break;
      case "price_desc": list.sort((a, b) => (b.price_per_person ?? 0) - (a.price_per_person ?? 0)); break;
      default: break;
    }
    return list;
  }, [favorites, filterCountry, filterCity, filterFormat, sortBy]);

  const hasFilters = filterCountry !== "Все страны" || filterCity !== "Все города" || filterFormat !== "Все форматы";
  const resetFilters = () => { setFilterCountry("Все страны"); setFilterCity("Все города"); setFilterFormat("Все форматы"); };

  const handleRemove = async (excursionId) => {
    setRemoving(excursionId);
    try {
      await removeFavorite(token, excursionId);
      setFavorites((prev) => prev.filter((ex) => ex.excursion_id !== excursionId));
    } catch { /* silent */ }
    finally { setRemoving(null); }
  };

  if (!token) {
    return (
      <div className="fav-page">
        <div className="fav-container">
          <h2 className="fav-title">Избранное</h2>
          <div className="fav-empty">
            <HeartIllustration />
            <p>Войдите в личный кабинет, чтобы сохранять избранные экскурсии</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fav-page">
      <div className="fav-container">

        <div className="fav-header">
          <h2 className="fav-title">
            Избранное
            {!loading && favorites.length > 0 && (
              <span className="fav-count">{favorites.length}</span>
            )}
          </h2>
        </div>

        {loading ? (
          <p className="fav-loading">Загружаем избранное...</p>
        ) : favorites.length === 0 ? (
          <div className="fav-empty">
            <HeartIllustration />
            <p>Вы ещё не добавили ни одной экскурсии в избранное</p>
            <button className="fav-cta" onClick={() => navigate("/search")}>
              Найти экскурсии
            </button>
          </div>
        ) : (
          <>
            {/* ── Filter bar ── */}
            <div className="fav-filters">
              <Select value={filterCountry} onChange={setFilterCountry} options={countries} />
              <Select value={filterCity}    onChange={setFilterCity}    options={cities}    disabled={cities.length <= 1} />
              <Select value={filterFormat}  onChange={setFilterFormat}  options={formats}   disabled={formats.length <= 1} />
              <div className="fav-filters-right">
                {hasFilters && (
                  <button className="fav-reset" onClick={resetFilters}>Сбросить</button>
                )}
                <Select value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} labelKey="label" valueKey="value" />
              </div>
            </div>

            {/* ── Results ── */}
            {filtered.length === 0 ? (
              <div className="fav-empty fav-empty--small">
                <p>По выбранным фильтрам ничего нет</p>
                <button className="fav-reset-link" onClick={resetFilters}>Сбросить фильтры</button>
              </div>
            ) : (
              <div className="fav-grid">
                {filtered.map((ex) => (
                  <div key={ex.excursion_id} className="fav-card-wrap">
                    <ExcursionCard
                      {...ex}
                      type={ex.difficulty}
                      guide={ex.guide_name ? { name: ex.guide_name, avatar: ex.guide_avatar } : undefined}
                      rating={ex.avg_rating}
                      reviewsCount={ex.reviews_count}
                      onCardClick={() => navigate(`/excursions/${ex.excursion_id}`)}
                    />
                    <button
                      className="fav-remove-btn"
                      onClick={() => handleRemove(ex.excursion_id)}
                      disabled={removing === ex.excursion_id}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#e53935" stroke="#e53935" strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      {removing === ex.excursion_id ? "Удаляем..." : "Убрать из избранного"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Select({ value, onChange, options, disabled, labelKey, valueKey }) {
  const getLabel = (opt) => (labelKey ? opt[labelKey] : opt);
  const getValue = (opt) => (valueKey ? opt[valueKey] : opt);
  return (
    <select
      className="fav-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((opt) => (
        <option key={getValue(opt)} value={getValue(opt)}>
          {getLabel(opt)}
        </option>
      ))}
    </select>
  );
}

function HeartIllustration() {
  return (
    <svg className="fav-heart-illus" viewBox="0 0 80 72" fill="none">
      <path
        d="M40 68 L8 36 C2 30 2 18 10 12 C18 6 28 9 34 15 L40 21 L46 15 C52 9 62 6 70 12 C78 18 78 30 72 36 Z"
        fill="#ffecec" stroke="#e53935" strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}
