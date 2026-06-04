import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GuidePage.css";
import ExcursionCard from "../components/ExcursionCard/ExcursionCard";
import { getPublicGuideProfile } from "../api/excursionsApi";
import { getRatingColor } from "../utils/ratingColor";
import prosIcon from "../assets/images/pros.svg";
import consIcon from "../assets/images/cons.svg";

function getRatingLabel(rating) {
  if (rating >= 9) return "Превосходно";
  if (rating >= 8) return "Отлично";
  if (rating >= 7) return "Хорошо";
  if (rating >= 6) return "Неплохо";
  if (rating >= 5) return "Удовлетворительно";
  return "Плохо";
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

        {/* ── Hero ── */}
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

        {/* ── Tabs ── */}
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

        {/* ── Excursions tab ── */}
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

        {/* ── Reviews tab ── */}
        {activeTab === "reviews" && (
          guide.reviews.length > 0 ? (
            <div className="guide-reviews-list">
              {guide.reviews.map((r) => {
                const [pros, cons] = r.comment
                  ? r.comment.split("\n---\n")
                  : ["Отличная экскурсия", null];
                return (
                  <div key={r.review_id} className="guide-review-card">
                    <div className="guide-review-header">
                      <div className="guide-review-meta">
                        <strong className="guide-review-name">{r.client_name}</strong>
                        {r.excursion_title && (
                          <span className="guide-review-excursion">{r.excursion_title} · {r.date}</span>
                        )}
                      </div>
                      <span
                        className="guide-review-badge"
                        style={{ background: getRatingColor(r.rating) }}
                      >
                        {r.rating}
                      </span>
                    </div>
                    <div className="guide-review-pros">
                      <img src={prosIcon} alt="+" className="guide-review-icon" />
                      {pros}
                    </div>
                    {cons && (
                      <div className="guide-review-cons">
                        <img src={consIcon} alt="-" className="guide-review-icon" />
                        {cons}
                      </div>
                    )}
                  </div>
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
