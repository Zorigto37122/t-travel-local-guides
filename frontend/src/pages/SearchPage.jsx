import React, { useEffect, useRef, useState } from "react";
import "./SearchPage.css";
import ExcursionCard from "../components/ExcursionCard/ExcursionCard";
import DatePicker from "../components/DatePicker/DatePicker";
import PeopleSelector from "../components/PeopleSelector/PeopleSelector";
import { searchExcursions, getAllLocations } from "../api/excursionsApi";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";
import { useSearchParams, useNavigate } from "react-router-dom";

const getNoun = (num, one, two, five) => {
  const n = Math.abs(num) % 100;
  if (n >= 5 && n <= 20) return five;
  const m = n % 10;
  if (m === 1) return one;
  if (m > 1 && m < 5) return two;
  return five;
};

const FORMAT_OPTIONS = ["Все форматы", "Индивидуальная", "Групповая"];
const TRANSPORT_OPTIONS = ["Любой способ", "пешком", "на автобусе", "на машине", "на велосипеде", "на лодке"];
const PRICE_OPTIONS = [
  { label: "Любая цена", min: 0, max: Infinity },
  { label: "до 1 500 ₽",  min: 0,    max: 1500 },
  { label: "1 500–3 000 ₽", min: 1500, max: 3000 },
  { label: "3 000–6 000 ₽", min: 3000, max: 6000 },
  { label: "от 6 000 ₽",  min: 6000, max: Infinity },
];

function FilterDropdown({ label, options, value, onChange, renderLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = value !== options[0];

  return (
    <div className={`filter-dropdown${open ? " filter-dropdown--open" : ""}`} ref={ref}>
      <button
        className={`filter-btn${isActive ? " filter-btn--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {renderLabel ? renderLabel(value) : value}
        <span className="filter-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="filter-dropdown-menu">
          {options.map((opt, i) => (
            <button
              key={i}
              className={`filter-dropdown-item${opt === value ? " filter-dropdown-item--selected" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {renderLabel ? renderLabel(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: searchParams.get("country") || "",
    city: searchParams.get("city") || "",
    date: searchParams.get("date") || "",
    people: Number(searchParams.get("people") || 1),
    children: Number(searchParams.get("children") || 0),
  });
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [locations, setLocations] = useState({ countries: [], citiesByCountry: {} });

  useEffect(() => {
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  const [filterFormat, setFilterFormat] = useState(FORMAT_OPTIONS[0]);
  const [filterTransport, setFilterTransport] = useState(TRANSPORT_OPTIONS[0]);
  const [filterPrice, setFilterPrice] = useState(PRICE_OPTIONS[0]);

  const [sortBy, setSortBy] = useState("popular");
  const [priceDir, setPriceDir] = useState("asc");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (!formData.country.trim()) {
      setSearchError("Укажите страну, чтобы выполнить поиск");
      setHasSearched(false);
      return;
    }
    const params = new URLSearchParams();
    params.set("country", formData.country);
    if (formData.city) params.set("city", formData.city);
    if (formData.date) params.set("date", formData.date);
    params.set("people", String(formData.people));
    if (formData.children > 0) params.set("children", String(formData.children));
    setSearchParams(params);
  };

  const resetFilters = () => {
    setFilterFormat(FORMAT_OPTIONS[0]);
    setFilterTransport(TRANSPORT_OPTIONS[0]);
    setFilterPrice(PRICE_OPTIONS[0]);
  };

  const hasActiveFilters = filterFormat !== FORMAT_OPTIONS[0] ||
    filterTransport !== TRANSPORT_OPTIONS[0] ||
    filterPrice !== PRICE_OPTIONS[0];

  const filteredResults = results.filter((ex) => {
    if (filterFormat !== FORMAT_OPTIONS[0] && ex.difficulty !== filterFormat) return false;
    if (filterTransport !== TRANSPORT_OPTIONS[0] && ex.transport !== filterTransport) return false;
    const price = ex.price_per_person ?? 0;
    if (price < filterPrice.min || price > filterPrice.max) return false;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "popular") return (b.reviews_count ?? 0) - (a.reviews_count ?? 0);
    if (sortBy === "price") {
      const diff = (a.price_per_person ?? 0) - (b.price_per_person ?? 0);
      return priceDir === "asc" ? diff : -diff;
    }
    if (sortBy === "rating") return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
    return 0;
  });

  const handleSortPrice = () => {
    if (sortBy === "price") {
      setPriceDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy("price");
      setPriceDir("asc");
    }
  };

  useEffect(() => {
    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";
    const date = searchParams.get("date") || "";
    const people = Number(searchParams.get("people") || 1);
    const children = Number(searchParams.get("children") || 0);

    if (!country.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setFormData({ country, city, date, people, children });

    const load = async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await searchExcursions({ country, city, date: date || undefined, people });
        setResults(data);
        setHasSearched(true);
      } catch (e) {
        setSearchError(e.message || "Не удалось выполнить поиск");
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    load();
  }, [searchParams]);

  const cityLabel = searchParams.get("city") || searchParams.get("country") || "";
  const resultWord = getNoun(sortedResults.length, "экскурсия", "экскурсии", "экскурсий");

  return (
    <div className="search-page-container">
      <h2 className="page-title">Авторские Экскурсии</h2>

      <div className="search-wrapper">
        <div className={`search-field${formData.country ? " search-field--has-value" : ""}`}>
          <label>Страна</label>
          <AutocompleteInput
            value={formData.country}
            onChange={(val) => setFormData((prev) => ({ ...prev, country: val, city: "" }))}
            placeholder="Страна"
            suggestions={locations.countries}
            onSubmit={handleSearch}
          />
        </div>
        <div className={`search-field${formData.city ? " search-field--has-value" : ""}`}>
          <label>Город</label>
          <AutocompleteInput
            value={formData.city}
            onChange={(val) => setFormData((prev) => ({ ...prev, city: val }))}
            placeholder="Город"
            suggestions={locations.citiesByCountry[formData.country] ?? Object.values(locations.citiesByCountry).flat()}
            onSubmit={handleSearch}
          />
        </div>
        <div className={`search-field${formData.date ? " search-field--has-value" : ""}`}>
          <label>Дата</label>
          <DatePicker value={formData.date} onChange={(iso) => setFormData((prev) => ({ ...prev, date: iso }))} placeholder="Дата" />
        </div>
        <div className="search-field search-field--has-value">
          <label>кол-во человек</label>
          <PeopleSelector
            adults={formData.people}
            children={formData.children}
            onChange={({ adults, children }) => setFormData((prev) => ({ ...prev, people: adults, children }))}
          />
        </div>
        <button className="search-button" onClick={handleSearch} disabled={searching}>
          {searching ? "Ищем..." : "Искать"}
        </button>
      </div>

      <div className="filter-row-wrapper">
        <FilterDropdown
          label="Формат проведения"
          options={FORMAT_OPTIONS}
          value={filterFormat}
          onChange={setFilterFormat}
        />
        <FilterDropdown
          label="Способ передвижения"
          options={TRANSPORT_OPTIONS}
          value={filterTransport}
          onChange={setFilterTransport}
        />
        <FilterDropdown
          label="Цена"
          options={PRICE_OPTIONS}
          value={filterPrice}
          onChange={setFilterPrice}
          renderLabel={(v) => v.label ?? v}
        />
        <div />
        <button
          className={`filter-btn filter-btn--primary${hasActiveFilters ? " filter-btn--reset" : ""}`}
          onClick={hasActiveFilters ? resetFilters : undefined}
        >
          {hasActiveFilters ? "Сбросить" : "Фильтры"}
        </button>
      </div>

      {searchError && <p className="search-error">{searchError}</p>}

      {hasSearched && !searching && (
        <p className="results-count">
          всего найдено: {sortedResults.length} {resultWord}
        </p>
      )}

      {hasSearched && sortedResults.length > 0 && (
        <>
          <div className="results-header">
            <h3 className="results-title">Экскурсии в городе {cityLabel}</h3>
            <div className="sort-tabs">
              <button
                className={`sort-tab${sortBy === "popular" ? " sort-tab--active" : ""}`}
                onClick={() => setSortBy("popular")}
              >
                По популярности
              </button>
              <button
                className={`sort-tab${sortBy === "price" ? " sort-tab--active" : ""}`}
                onClick={handleSortPrice}
              >
                По цене{sortBy === "price" ? (priceDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
              <button
                className={`sort-tab${sortBy === "rating" ? " sort-tab--active" : ""}`}
                onClick={() => setSortBy("rating")}
              >
                По рейтингу
              </button>
            </div>
          </div>
          <div className="excursions-grid">
            {sortedResults.map((excursion) => (
              <ExcursionCard
                key={excursion.excursion_id}
                {...excursion}
                type={excursion.difficulty}
                guide={excursion.guide_name ? { name: excursion.guide_name, avatar: excursion.guide_avatar } : undefined}
                rating={excursion.avg_rating}
                reviewsCount={excursion.reviews_count}
                onCardClick={() => navigate(`/excursions/${excursion.excursion_id}`)}
              />
            ))}
          </div>
        </>
      )}

      {hasSearched && sortedResults.length === 0 && !searchError && !searching && (
        <p className="search-info">
          {hasActiveFilters ? "По выбранным фильтрам экскурсий нет. " : "По выбранным параметрам экскурсий нет."}
          {hasActiveFilters && <button className="filter-reset-link" onClick={resetFilters}>Сбросить фильтры</button>}
        </p>
      )}

      {!hasSearched && !searchError && !searching && (
        <p className="search-info">Уточните параметры и нажмите «Искать».</p>
      )}
    </div>
  );
};

export default SearchPage;
