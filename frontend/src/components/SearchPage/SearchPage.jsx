import React, { useEffect, useState } from "react";
import "./SearchPage.css";
import ExcursionCard from "../ExcursionCard/ExcursionCard";
import { searchExcursions } from "../../api";
import { useAuth } from "../../AuthContext.jsx";
import { useSearchParams, useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: searchParams.get("country") || "",
    city: searchParams.get("city") || "",
    date: searchParams.get("date") || "",
    people: Number(searchParams.get("people") || 1),
    hasChildren: searchParams.get("has_children") === "true",
  });
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { token } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    if (formData.people) params.set("people", String(formData.people));
    if (formData.hasChildren) params.set("has_children", "true");

    setSearchParams(params);
  };

  useEffect(() => {
    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";
    const date = searchParams.get("date") || "";
    const people = Number(searchParams.get("people") || 1);
    const hasChildren = searchParams.get("has_children") === "true";

    if (!country.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setFormData({
      country,
      city,
      date,
      people,
      hasChildren,
    });

    const load = async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await searchExcursions({
          country,
          city,
          date: date || undefined,
          people: Number(people) || 1,
          hasChildren,
        });
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




  return (
    <div className="search-page-container">
      <h2 className="page-title">Авторские Экскурсии</h2>

      <div className="search-wrapper">
        <div className="search-field">
          <input
            type="text"
            name="country"
            placeholder="Страна"
            value={formData.country}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <input
            type="text"
            name="city"
            placeholder="Город"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <input
            type="date"
            name="date"
            placeholder="Дата"
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <label>Кол-во человек</label>
          <input
            type="number"
            name="people"
            min="1"
            value={formData.people}
            onChange={handleChange}
          />
        </div>

        <div className="search-field search-field--checkbox">
          <label>
            <input
              type="checkbox"
              name="hasChildren"
              checked={formData.hasChildren}
              onChange={handleChange}
            />
            С детьми
          </label>
        </div>

        <button className="search-button" onClick={handleSearch} disabled={searching}>
          {searching ? "Ищем..." : "Искать"}
        </button>
      </div>

      {searchError && <p className="search-error">{searchError}</p>}
      {!hasSearched && !searchError && !searching && (
        <p className="search-info">
          Уточните фильтры и нажмите «Искать», чтобы увидеть актуальные экскурсии.
        </p>
      )}
      {hasSearched && results.length === 0 && !searchError && !searching && (
        <p className="search-info">
          По выбранным параметрам экскурсий нет.
        </p>
      )}

      {hasSearched && results.length > 0 && (
        <div className="excursions-grid">
          {results.map((excursion) => (
            <ExcursionCard
              key={excursion.excursion_id}
              {...excursion}
              onCardClick={() => navigate(`/excursions/${excursion.excursion_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;