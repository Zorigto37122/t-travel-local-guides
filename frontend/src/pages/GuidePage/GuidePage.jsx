import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GuidePage.css";
import ExcursionCard from "../../components/ExcursionCard/ExcursionCard";
import ReviewCard from "../../components/ReviewCard/ReviewCard";
import { getPublicGuideProfile } from "../../api/excursionsApi";
import { getRatingColor, getRatingLabel } from "../../utils/ratingColor";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function getAvatarUrl(photo) {
  if (!photo) return null;
  if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
  return `${API_URL}${photo}`;
}

export default function GuidePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("excursions");

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicGuideProfile(id)
      .then(setGuide)
      .catch((e) => setError(e.message || "Не удалось загрузить профиль гида"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="guide-page-loading">Загружаем профиль гида...</div>;
  if (error) return <div className="guide-page-loading">Ошибка: {error}</div>;
  if (!guide) return <div className="guide-page-loading">Гид не найден</div>;

  const avatarUrl = getAvatarUrl(guide.photo);

  return (
    <div className="guide-page">
      <div className="guide-page-container">

        <div className="guide-hero">
          <div className="guide-hero-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={guide.name} className="guide-hero-avatar" />
            ) : (
              <div className="guide-hero-avatar guide-hero-avatar--placeholder">
                {guide.name?.[0] || "Г"}
              </div>
            )}
          </div>
          <div className="guide-hero-info">
            <h1 className="guide-hero-name">{guide.name}</h1>

            {guide.average_rating != null && (
              <div className="guide-hero-meta">
                <span
                  className="guide-hero-rating"
                  style={{ background: getRatingColor(guide.average_rating) }}
                >
                  {guide.average_rating}
                </span>
                <span className="guide-hero-rating-label">
                  {getRatingLabel(guide.average_rating)} · на основе {guide.reviews.length} отзывов
                </span>
              </div>
            )}

            <div className="guide-hero-stats">
              <div className="guide-stat-box">
                <span className="guide-stat-value">{guide.excursions.length}</span>
                <span className="guide-stat-label">экскурсий</span>
              </div>
              {guide.total_clients > 0 && (
                <div className="guide-stat-box">
                  <span className="guide-stat-value">{guide.total_clients}</span>
                  <span className="guide-stat-label">посетителей</span>
                </div>
              )}
              <div className="guide-stat-box">
                <span className="guide-stat-value">{guide.reviews.length}</span>
                <span className="guide-stat-label">отзывов</span>
              </div>
              {guide.experience && (
                <div className="guide-stat-box">
                  <span className="guide-stat-value">{guide.experience}</span>
                  <span className="guide-stat-label">стаж</span>
                </div>
              )}
            </div>

            {guide.bio && (
              <p className="guide-hero-bio">{guide.bio}</p>
            )}
          </div>
        </div>

        <div className="guide-tabs">
          <button
            className={`guide-tab${activeTab === "excursions" ? " guide-tab--active" : ""}`}
            onClick={() => setActiveTab("excursions")}
          >
            Экскурсии ({guide.excursions.length})
          </button>
          <button
            className={`guide-tab${activeTab === "reviews" ? " guide-tab--active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Отзывы ({guide.reviews.length})
          </button>
        </div>

        {activeTab === "excursions" && (
          guide.excursions.length > 0 ? (
            <div className="guide-excursions-grid">
              {guide.excursions.map((ex) => (
                <ExcursionCard
                  key={ex.excursion_id}
                  {...ex}
                  type={ex.difficulty}
                  guide={ex.guide_name ? { name: ex.guide_name, avatar: ex.guide_avatar } : undefined}
                  rating={ex.avg_rating}
                  reviewsCount={ex.reviews_count}
                  onCardClick={() => navigate(`/excursions/${ex.excursion_id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="guide-empty">У гида пока нет опубликованных экскурсий</p>
          )
        )}

        {activeTab === "reviews" && (
          guide.reviews.length > 0 ? (
            <div className="guide-reviews-list">
              {guide.reviews.map((r) => {
                const [rawPros, cons] = r.comment
                  ? r.comment.split("\n---\n")
                  : ["Отличная экскурсия", null];
                const pros = rawPros && rawPros !== "None" && rawPros !== "null" ? rawPros : null;
                return (
                  <ReviewCard
                    key={r.review_id}
                    clientName={r.client_name}
                    subtitle={r.excursion_title ? `${r.excursion_title} · ${r.date}` : null}
                    rating={r.rating}
                    pros={pros}
                    cons={cons}
                  />
                );
              })}
            </div>
          ) : (
            <p className="guide-empty">Отзывов пока нет</p>
          )
        )}

      </div>
    </div>
  );
}
