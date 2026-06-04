import React, { useState, useEffect } from "react";
import "./SearchPage.css";
import { useNavigate } from "react-router-dom";
import DatePicker from "../components/DatePicker/DatePicker";
import PeopleSelector from "../components/PeopleSelector/PeopleSelector";
import { MapPointIcon, PercentIcon, DocumentIcon } from "../components/FeatureIcons/FeatureIcons";
import { searchExcursions, getAllLocations } from "../api/excursionsApi";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";

const POPULAR_CITIES = [
  { id: 1, name: "Москва", country: "Россия", img: "https://i.ibb.co/JhvLWTv/8.webp" },
  { id: 2, name: "Санкт-Петербург", country: "Россия", img: "https://i.ibb.co/ZzyFPWG9/images-2021-08-30-1618617108sankt-peterburg-krasivie-mesta-foto-large.jpg" },
  { id: 3, name: "Стамбул", country: "Турция", img: "https://i.ibb.co/SDXGVPH8/1574264160-sultanahm.jpg" },
  { id: 4, name: "Вена", country: "Австрия", img: "https://i.ibb.co/4RMmXfkk/a938f68769195411fb67644ac02908e5.jpg" },
  { id: 5, name: "Казань", country: "Россия", img: "https://i.ibb.co/zTzVRLs8/optimize.webp" },
  { id: 6, name: "Сочи", country: "Россия", img: "https://i.ibb.co/DH5VwcFF/sochi.webp" },
];

const FEATURES = [
  {
    id: "taste",
    Icon: MapPointIcon,
    title: "На любой вкус",
    description: "Выбирайте экскурсии, основываясь на своих предпочтениях и отзывах других пользователей",
  },
  {
    id: "cashback",
    Icon: PercentIcon,
    title: "Больше выгоды",
    description: "Получайте кэшбек до 5% от Т-Банка реальными рублями",
  },
  {
    id: "safety",
    Icon: DocumentIcon,
    title: "Безопасная оплата",
    description: "Оплачивайте экскурсии у проверенных гидов через T-Pay без ввода реквизитов карты",
  },
];

const sf = (value) => `search-field${value ? " search-field--has-value" : ""}`;

const HomePage = () => {
  const [formData, setFormData] = useState({ country: "Россия", city: "", date: "", people: 1, children: 0 });
  const [cityCountMap, setCityCountMap] = useState({});
  const [cityStatsLoaded, setCityStatsLoaded] = useState(false);
  const [locations, setLocations] = useState({ countries: [], citiesByCountry: {} });

  const navigate = useNavigate();

  useEffect(() => {
    getAllLocations().then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all(
      POPULAR_CITIES.map((city) =>
        searchExcursions({ country: city.country, city: city.name })
          .then((results) => ({ key: `${city.name.toLowerCase()}|${city.country.toLowerCase()}`, count: results.length }))
          .catch(() => ({ key: `${city.name.toLowerCase()}|${city.country.toLowerCase()}`, count: null }))
      )
    ).then((entries) => {
      const map = {};
      entries.forEach(({ key, count }) => { map[key] = count; });
      setCityCountMap(map);
    }).finally(() => setCityStatsLoaded(true));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (formData.country) params.set("country", formData.country);
    if (formData.city) params.set("city", formData.city);
    if (formData.date) params.set("date", formData.date);
    params.set("people", String(formData.people));
    if (formData.children > 0) params.set("children", String(formData.children));
    navigate(`/search?${params.toString()}`);
  };

  const handleCityCard = (city) => {
    const params = new URLSearchParams();
    params.set("country", city.country);
    params.set("city", city.name);
    params.set("people", "1");
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search-page-container">
      <h2 className="page-title">Авторские Экскурсии</h2>

      <div className="search-wrapper">
        <div className={sf(formData.country)}>
          <label>Страна</label>
          <AutocompleteInput
            value={formData.country}
            onChange={(val) => setFormData((prev) => ({ ...prev, country: val, city: "" }))}
            placeholder="Страна"
            suggestions={locations.countries}
            onSubmit={handleSearch}
          />
        </div>

        <div className={sf(formData.city)}>
          <label>Город</label>
          <AutocompleteInput
            value={formData.city}
            onChange={(val) => {
              setFormData((prev) => {
                const update = { ...prev, city: val };
                const detectedCountry = Object.entries(locations.citiesByCountry)
                  .find(([, cities]) => cities.map(c => c.toLowerCase()).includes(val.toLowerCase()))?.[0];
                if (detectedCountry && detectedCountry !== prev.country) {
                  update.country = detectedCountry;
                }
                return update;
              });
            }}
            placeholder="Город"
            suggestions={locations.citiesByCountry[formData.country] ?? Object.values(locations.citiesByCountry).flat()}
            onSubmit={handleSearch}
          />
        </div>

        <div className={sf(formData.date)}>
          <label>Дата</label>
          <DatePicker
            value={formData.date}
            onChange={(iso) => setFormData((prev) => ({ ...prev, date: iso }))}
            placeholder="Дата"
          />
        </div>

        <div className="search-field search-field--has-value">
          <label>кол-во человек</label>
          <PeopleSelector
            adults={formData.people}
            children={formData.children}
            onChange={({ adults, children }) =>
              setFormData((prev) => ({ ...prev, people: adults, children }))
            }
          />
        </div>

        <button className="search-button" onClick={handleSearch}>
          Искать
        </button>
      </div>

      <div className="feature-boxes">
        {FEATURES.map(({ id, Icon, title, description }) => (
          <div key={id} className="feature-box">
            <Icon size={38} />
            <div className="feature-text">
              <div className="feature-title">{title}</div>
              <p className="feature-description">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="second-page-title">Популярные города у наших путешественников</h3>

      <div className="cities-grid">
        {POPULAR_CITIES.map((city) => {
          const count = cityCountMap[`${city.name.toLowerCase()}|${city.country.toLowerCase()}`];
          return (
            <div key={city.id} className="city-card" onClick={() => handleCityCard(city)}>
              <div className="city-image-wrapper">
                <img src={city.img} alt={city.name} />
              </div>
              <div className="city-info">
                <h3 className="city-name">{city.name}</h3>
                {cityStatsLoaded && count != null && (
                  <span className="city-count">{count} экскурсий</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
