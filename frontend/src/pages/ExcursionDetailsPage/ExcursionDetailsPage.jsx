import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExcursionDetailsPage.css";
import ExcursionCard from "../../components/ExcursionCard/ExcursionCard";
import {
  getExcursionById, getExcursionReviews, getAvailableDates, createBooking, searchExcursions,
  checkFavorite, addFavorite, removeFavorite, submitReview, getMyReview, canReviewExcursion,
  getPublicGuideProfile,
} from "../../api/excursionsApi";
import { useAuth } from "../../AuthContext.jsx";
import prosIcon from "../../assets/images/pros.svg";
import consIcon from "../../assets/images/cons.svg";
import { getRatingColor } from "../../utils/ratingColor";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function getRatingLabel(rating) {
  if (rating >= 9) return "Превосходно";
  if (rating >= 8) return "Отлично";
  if (rating >= 7) return "Хорошо";
  if (rating >= 6) return "Неплохо";
  if (rating >= 5) return "Удовлетворительно";
  return "Плохо";
}

function parsePhotos(photosStr) {
  if (!photosStr) return [];
  return photosStr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith("data:image") || p.startsWith("http")) return p;
      return `${API_URL}${p}`;
    });
}

function getGuideAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  return `${API_URL}${avatar}`;
}

const PLACEHOLDER = "https://dummyimage.com/600x400/f3f4f6/cccccc&text=Фото";

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderDescription(text) {
  if (!text) return [<p key="empty">Описание экскурсии будет добавлено позже.</p>];
  const lines = text.split('\n');
  const result = [];
  let paraLines = [];
  let key = 0;

  const flushPara = () => {
    if (paraLines.length === 0) return;
    result.push(
      <p key={key++}>
        {paraLines.reduce((acc, line, i) => {
          if (i > 0) acc.push(<br key={`br-${i}`} />);
          acc.push(...[renderInline(line)].flat());
          return acc;
        }, [])}
      </p>
    );
    paraLines = [];
  };

  for (const line of lines) {
    const t = line.trimStart();
    let m;
    if ((m = t.match(/^###\s*(.*)/))) {
      flushPara();
      result.push(<h4 key={key++} className="desc-h3">{renderInline(m[1].trim())}</h4>);
    } else if ((m = t.match(/^##(?!#)\s*(.*)/))) {
      flushPara();
      result.push(<h3 key={key++} className="desc-h2">{renderInline(m[1].trim())}</h3>);
    } else if ((m = t.match(/^#(?!#)\s*(.*)/))) {
      flushPara();
      result.push(<h2 key={key++} className="desc-h1">{renderInline(m[1].trim())}</h2>);
    } else if (t === '') {
      flushPara();
    } else {
      paraLines.push(line);
    }
  }
  flushPara();
  return result;
}

function plainText(text, maxLen = 160) {
  if (!text) return '';
  const plain = text
    .split('\n')
    .map(l => l.replace(/^#{1,6}\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

function Lightbox({ photos, startIndex, onClose }) {
  const [current, setCurrent] = React.useState(startIndex);

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") setCurrent(c => (c - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setCurrent(c => (c + 1) % photos.length);
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [photos.length, onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>×</button>
      <button className="lightbox-nav lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); setCurrent(c => (c - 1 + photos.length) % photos.length); }}>‹</button>
      <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={photos[current]} alt={`Фото ${current + 1}`} className="lightbox-img" />
      </div>
      <button className="lightbox-nav lightbox-nav--next" onClick={(e) => { e.stopPropagation(); setCurrent(c => (c + 1) % photos.length); }}>›</button>
      <div className="lightbox-counter">{current + 1} / {photos.length}</div>
    </div>
  );
}

function GalleryModal({ photos, title, onClose, onPhotoClick }) {
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div className="gallery-modal-box" onClick={e => e.stopPropagation()}>
        <div className="gallery-modal-header">
          <span className="gallery-modal-title">{title} — все фото ({photos.length})</span>
          <button className="gallery-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="gallery-modal-scroll">
          <div className={`gallery-modal-grid gallery-modal-grid--${Math.min(photos.length, 3)}`}>
            {photos.map((photo, i) => (
              <div key={i} className="gallery-modal-item" onClick={() => onPhotoClick(i)}>
                <img src={photo} alt={`Фото ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoGallery({ photos, title }) {
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const [showModal, setShowModal]         = React.useState(false);
  const [fallbackRatios, setFallbackRatios] = React.useState({});

  if (!photos || photos.length === 0) return null;

  const urlRatio = (url) => {
    const mPath = url.match(/\/(\d+)\/(\d+)(?:\?.*)?$/);
    if (mPath) return parseInt(mPath[1]) / parseInt(mPath[2]);
    const wm = url.match(/[?&]w=(\d+)/);
    const hm = url.match(/[?&]h=(\d+)/);
    if (wm && hm) return parseInt(wm[1]) / parseInt(hm[1]);
    return null;
  };

  const getRatio = (idx) =>
    urlRatio(photos[idx]) ?? fallbackRatios[idx] ?? 1.5;

  const MAX_PHOTOS = 11;
  const shown = photos.slice(0, MAX_PHOTOS);

  const cols = [[0]];
  let startIdx = 1;
  if (shown.length > 1) {
    const r1 = getRatio(1);
    if (r1 < 1.0 && shown.length > 1) {
      cols.push([1]);
      startIdx = 2;
    } else if (shown.length > 2) {
      cols.push([1, 2]);
      startIdx = 3;
    } else {
      cols.push([1]);
      startIdx = 2;
    }
  }
  for (let i = startIdx; i < shown.length; i += 2) {
    const c = [i];
    if (i + 1 < shown.length) c.push(i + 1);
    cols.push(c);
  }

  const wrapRef = React.useRef(null);
  const [GALLERY_H, setGalleryH] = React.useState(400);

  React.useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const h = wrapRef.current.getBoundingClientRect().height;
    if (h > 0) setGalleryH(h);
  }, [photos]);

  const colPx = (idxs) => {
    if (idxs.length === 1) return Math.round(getRatio(idxs[0]) * GALLERY_H);
    const r1 = getRatio(idxs[0]), r2 = getRatio(idxs[1]);
    return Math.round((r1 * r2) / (r1 + r2) * GALLERY_H);
  };

  const colWidths = cols.map(c => colPx(c));

  const cellFlex = (idxs, pos) => {
    if (idxs.length === 1) return 1;
    return 1 / getRatio(idxs[pos]);
  };

  const onLoad = (e, idx) => {
    const { naturalWidth: w, naturalHeight: h } = e.target;
    if (w && h && !urlRatio(photos[idx]))
      setFallbackRatios(prev => ({ ...prev, [idx]: w / h }));
  };

  const lastShownIdx = shown.length - 1;
  const hasMore = photos.length > shown.length;

  return (
    <>
      <div className="gallery-outer" ref={wrapRef}>
        <div className="gallery-wrap">
          <div className="gallery-adaptive">
            {cols.map((idxs, ci) => (
              <div key={ci} className="gallery-col" style={{ width: `${colWidths[ci]}px` }}>
                {idxs.map((idx, pos) => (
                  <div
                    key={idx}
                    className="gallery-cell"
                    style={{ flex: cellFlex(idxs, pos) }}
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img className="gallery-cell-bg" src={shown[idx]} alt="" aria-hidden="true" />
                    <img
                      className="gallery-cell-img"
                      src={shown[idx]}
                      alt={`${title} фото ${idx + 1}`}
                      onLoad={e => onLoad(e, idx)}
                    />
                    {idx === lastShownIdx && (
                      <button
                        className="gallery-all-btn"
                        onClick={e => { e.stopPropagation(); setShowModal(true); }}
                      >
                        {hasMore
                          ? `Ещё +${photos.length - shown.length} фото`
                          : `Все фото · ${photos.length}`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      {showModal && (
        <GalleryModal
          photos={photos}
          title={title}
          onClose={() => setShowModal(false)}
          onPhotoClick={i => { setShowModal(false); setLightboxIndex(i); }}
        />
      )}
    </>
  );
}

function RelatedCarousel({ title, items, navigate }) {
  const scrollRef = React.useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(".related-card-wrap");
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="related-section">
      <h2>{title}</h2>
      <div className="related-carousel">
        <button className="carousel-btn carousel-btn--prev" onClick={() => scroll(-1)} aria-label="Назад">‹</button>
        <button className="carousel-btn carousel-btn--next" onClick={() => scroll(1)} aria-label="Вперёд">›</button>
        <div className="related-clip">
          <div className="related-scroll" ref={scrollRef}>
            {items.map((ex) => (
              <div key={ex.excursion_id} className="related-card-wrap">
                <ExcursionCard
                  {...ex}
                  type={ex.difficulty}
                  guide={ex.guide_name ? { name: ex.guide_name, avatar: ex.guide_avatar } : undefined}
                  rating={ex.avg_rating}
                  reviewsCount={ex.reviews_count}
                  onCardClick={() => navigate(`/excursions/${ex.excursion_id}`)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ExcursionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeHint, setLikeHint] = useState(false);
  const [likeError, setLikeError] = useState(null);

  const photos = React.useMemo(
    () => (excursion ? parsePhotos(excursion.photos) : []),
    [excursion?.photos]
  );
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [myReview, setMyReview] = useState(undefined);
  const [canReview, setCanReview] = useState(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewPros, setReviewPros] = useState("");
  const [reviewCons, setReviewCons] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [availableDates, setAvailableDates] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [people, setPeople] = useState(1);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [related, setRelated] = useState([]);
  const [guideProfile, setGuideProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExcursionById(id);
        if (mounted) setExcursion(data);
      } catch (e) {
        if (mounted) setError(e.message || "Не удалось загрузить экскурсию");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!excursion) return;
    loadAvailableDates();
    loadRelated();
    loadReviews();
    if (excursion.guide_id) {
      getPublicGuideProfile(excursion.guide_id)
        .then(setGuideProfile)
        .catch(() => {});
    }
    if (token) {
      checkFavorite(token, id)
        .then((r) => setLiked(r.is_favorite))
        .catch(() => {});
      getMyReview(token, id)
        .then((r) => setMyReview(r))
        .catch(() => setMyReview(null));
      canReviewExcursion(token, id)
        .then((r) => setCanReview(r.can_review))
        .catch(() => setCanReview(false));
    }
  }, [excursion]);

  const loadAvailableDates = async () => {
    if (!excursion) return;
    setLoadingDates(true);
    try {
      const data = await getAvailableDates(id, people);
      setAvailableDates(data);
    } catch {
      // silent
    } finally {
      setLoadingDates(false);
    }
  };

  const loadRelated = async () => {
    if (!excursion) return;
    try {
      const data = await searchExcursions({ country: excursion.country, city: excursion.city, people: 1 });
      setRelated(data.filter((e) => e.excursion_id !== excursion.excursion_id).slice(0, 4));
    } catch {
      // silent
    }
  };

  const loadReviews = async () => {
    try {
      const data = await getExcursionReviews(id);
      setReviews(data);
    } catch {
      // silent
    }
  };

  const groupedSlots = React.useMemo(() => {
    if (!availableDates?.time_slots) return {};
    const grouped = {};
    availableDates.time_slots.forEach((slot) => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot);
    });
    return grouped;
  }, [availableDates]);

  const availableTimesForDate = React.useMemo(() => {
    if (!selectedDate || !groupedSlots[selectedDate]) return [];
    return groupedSlots[selectedDate].filter((s) => s.available);
  }, [selectedDate, groupedSlots]);

  const handleBook = async () => {
    if (!token) { setBookingError("Для бронирования нужно войти в личный кабинет"); return; }
    if (!selectedDate) { setBookingError("Выберите дату"); return; }
    if (!selectedTime) { setBookingError("Выберите время"); return; }
    setBookingError(null);
    setBookingMessage(null);
    const dateTimeISO = `${selectedDate}T${selectedTime}:00`;
    try {
      const resp = await createBooking({ token, excursionId: Number(id), dateTimeISO, people: Number(people) || 1 });
      setBookingMessage(resp.message || "Экскурсия успешно забронирована");
      setSelectedDate("");
      setSelectedTime("");
      await loadAvailableDates();
    } catch (e) {
      setBookingError(e.message || "Не удалось забронировать");
    }
  };

  React.useEffect(() => {
    if (showAllReviews) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [showAllReviews]);

  if (loading) return <div className="details-loading-screen">Загружаем экскурсию...</div>;
  if (error) return <div className="details-loading-screen">Ошибка: {error}</div>;
  if (!excursion) return <div className="details-loading-screen">Экскурсия не найдена</div>;

  const avgRating = excursion.avg_rating ?? null;
  const guideAvgRating = excursion.guide_avg_rating ?? avgRating;
  const reviewsCount = excursion.reviews_count ?? 0;
  const isGroupPrice = excursion.price_type === "per_group";
  const guideAvatarUrl = getGuideAvatarUrl(excursion.guide_avatar);

  return (
    <div className="details-page">
      <div className="details-container">

        <div className="details-intro">
          <div className="details-intro-top">
            {avgRating != null && avgRating >= 8 && (
              <span className="badge-recommend">Советуем</span>
            )}
            <div className="btn-like-wrap">
              <button
                className={`btn-like${liked ? " btn-like--active" : ""}${likeLoading ? " btn-like--loading" : ""}${liked ? " btn-like--pop" : ""}`}
                onClick={async () => {
                  if (!token) {
                    setLikeHint(true);
                    setTimeout(() => setLikeHint(false), 2500);
                    return;
                  }
                  if (likeLoading) return;
                  setLikeLoading(true);
                  setLikeError(null);
                  try {
                    if (liked) {
                      await removeFavorite(token, Number(id));
                      setLiked(false);
                    } else {
                      await addFavorite(token, Number(id));
                      setLiked(true);
                    }
                  } catch (e) {
                    setLikeError(e.message || "Ошибка");
                    setTimeout(() => setLikeError(null), 3000);
                  } finally {
                    setLikeLoading(false);
                  }
                }}
                aria-label={liked ? "Убрать из избранного" : "Добавить в избранное"}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" className="btn-like-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </button>
              {likeHint && <div className="like-hint">Войдите, чтобы добавить в избранное</div>}
              {likeError && <div className="like-hint like-hint--error">{likeError}</div>}
            </div>
          </div>

          <div className="details-intro-body">
            <div className="details-intro-text">
              <h1 className="details-title">{excursion.title}</h1>
              <p className="details-subtitle">
                {excursion.description
                  ? (excursion.short_description || plainText(excursion.description))
                  : `Авторская экскурсия по ${excursion.city}, ${excursion.country}`}
              </p>
              <div className="details-rating-row">
                {avgRating != null && (
                  <span className="details-rating-badge" style={{ background: getRatingColor(avgRating) }}>
                    {avgRating}
                  </span>
                )}
                {avgRating != null && <span className="details-rating-label">{getRatingLabel(avgRating)}</span>}
                <a href="#reviews" className="details-rating-count">{reviewsCount} оценок</a>
              </div>
            </div>

            <div className="details-price-action">
              <div className="details-price-text">
                <span className="details-price-amount">{Number(excursion.price_per_person).toLocaleString("ru-RU")} ₽</span>
                <span className="details-price-type">
                  {isGroupPrice
                    ? `за группу${excursion.available_slots ? ` до ${excursion.available_slots} чел.` : ""}`
                    : "с человека"}
                </span>
              </div>
              <button
                className="details-book-cta"
                onClick={() => { setBookingOpen(true); setTimeout(() => document.getElementById("booking-anchor")?.scrollIntoView({ behavior: "smooth" }), 50); }}
              >
                Выбрать дату
              </button>
            </div>
          </div>
        </div>

        <PhotoGallery photos={photos} title={excursion.title} />

        <div className="details-content">
          <div className="details-description">
            <h2>Об экскурсии</h2>
            {renderDescription(excursion.description)}
          </div>

          <div className="details-sidebar">
            <div className="guide-card">
              <div className="guide-card-header">
                {guideAvatarUrl ? (
                  <img src={guideAvatarUrl} alt="Гид" className="guide-card-avatar" />
                ) : (
                  <div className="guide-card-avatar guide-card-avatar--placeholder" />
                )}
                <div className="guide-card-info">
                  <span className="guide-card-name">{excursion.guide_name || "Гид"}</span>
                  {guideAvgRating != null && (
                    <span className="guide-card-badge" style={{ background: getRatingColor(guideAvgRating) }}>
                      {guideAvgRating}
                    </span>
                  )}
                </div>
              </div>
              <div className="guide-card-stats">
                {excursion.guide_experience && (
                  <div className="guide-stat-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Стаж: {excursion.guide_experience}
                  </div>
                )}
                {guideProfile?.total_clients > 0 && (
                  <div className="guide-stat-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    {guideProfile.total_clients} посетителей
                  </div>
                )}
                {(() => {
                  const cnt = guideProfile?.reviews?.length ?? reviewsCount;
                  return cnt > 0 ? (
                    <div className="guide-stat-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      {cnt} {cnt === 1 ? "отзыв" : cnt < 5 ? "отзыва" : "отзывов"}
                    </div>
                  ) : null;
                })()}
              </div>
              {excursion.guide_bio && (
                <p className="guide-card-bio">{excursion.guide_bio}</p>
              )}
              {excursion.guide_id && (
                <button className="guide-all-btn" onClick={() => navigate(`/guides/${excursion.guide_id}`)}>
                  Все экскурсии гида
                </button>
              )}
            </div>

            <div className="tour-details-card">
              <div className="tour-detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span>{excursion.difficulty || "Индивидуальная"}</span>
              </div>
              <div className="tour-detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                <span>{excursion.available_slots != null ? `до ${excursion.available_slots} человек` : "1-5 человек"}</span>
              </div>
              <div className="tour-detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{excursion.duration || "Уточняется"}</span>
              </div>
              <div className="tour-detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="5" r="1"/><path d="M6 11l6-6 6 6"/><path d="M12 5v14"/></svg>
                <span>{excursion.transport || "Пешком"}</span>
              </div>
            </div>

            <div className="details-booking" id="booking-anchor">
              <h3>Бронирование</h3>

              <label className="booking-people-label">
                Количество человек
                <input
                  type="number"
                  min="1"
                  value={people}
                  onChange={(e) => {
                    setPeople(parseInt(e.target.value) || 1);
                    setSelectedDate("");
                    setSelectedTime("");
                  }}
                />
              </label>

              {loadingDates ? (
                <p className="details-loading">Загружаем даты…</p>
              ) : Object.keys(groupedSlots).length > 0 ? (
                <>
                  <div className="booking-dates-section">
                    <h4>Выберите дату</h4>
                    <div className="dates-grid">
                      {Object.keys(groupedSlots).sort().slice(0, 14).map((dateStr) => {
                        const slots = groupedSlots[dateStr];
                        const hasAvail = slots.some((s) => s.available);
                        const d = new Date(dateStr);
                        return (
                          <button
                            key={dateStr}
                            className={`date-button${selectedDate === dateStr ? " selected" : ""}${!hasAvail ? " disabled" : ""}`}
                            onClick={() => hasAvail && setSelectedDate(dateStr)}
                            disabled={!hasAvail}
                          >
                            <div className="date-day-name">{d.toLocaleDateString("ru-RU", { weekday: "short" })}</div>
                            <div className="date-day-number">{d.getDate()}</div>
                            <div className="date-month">{d.toLocaleDateString("ru-RU", { month: "short" })}</div>
                            {!hasAvail && <div className="date-unavailable">Нет мест</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDate && availableTimesForDate.length > 0 && (
                    <div className="booking-times-section">
                      <h4>Выберите время</h4>
                      <div className="times-grid">
                        {availableTimesForDate.map((slot) => (
                          <button
                            key={`${slot.date}_${slot.time}`}
                            className={`time-button${selectedTime === slot.time ? " selected" : ""}`}
                            onClick={() => setSelectedTime(slot.time)}
                          >
                            {slot.time}
                            {slot.available_slots !== null && (
                              <span className="time-slots-info">{slot.available_slots} мест</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && selectedTime && (
                    <div className="booking-summary">
                      <p className="booking-summary-text">
                        {new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })} в {selectedTime}
                      </p>
                      <p className="booking-summary-price">
                        Итого: <strong>{isGroupPrice
                          ? Number(excursion.price_per_person).toLocaleString("ru-RU")
                          : (excursion.price_per_person * people).toLocaleString("ru-RU")
                        } ₽</strong>
                      </p>
                      <button className="details-book-button" onClick={handleBook}>
                        Забронировать
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="details-error">Нет доступных дат</p>
              )}

              {bookingMessage && <div className="booking-success-message"><p>✓ {bookingMessage}</p></div>}
              {bookingError && <div className="booking-error-message"><p>✗ {bookingError}</p></div>}
            </div>
          </div>
        </div>

        <section className="reviews-section" id="reviews">
          <h2 className="reviews-title">Отзывы посетителей</h2>

          <div className="reviews-layout">
            <div className="reviews-list">
              {reviews.length > 0 ? reviews.slice(0, 3).map((r) => {
                const [rawPros, cons] = r.comment
                  ? r.comment.split("\n---\n")
                  : ["Отличная экскурсия", null];
                const pros = rawPros && rawPros !== "None" && rawPros !== "null" ? rawPros : null;
                return (
                  <div key={r.review_id} className="review-card">
                    <div className="review-card-header">
                      <div className="review-card-meta">
                        <strong className="review-card-name">{r.client_name}</strong>
                        <span className="review-card-subtitle">{excursion.title} • {r.date}</span>
                      </div>
                      <span className="review-card-badge" style={{ background: getRatingColor(r.rating) }}>
                        {r.rating}
                      </span>
                    </div>
                    <div className="review-card-pros">
                      <img src={prosIcon} alt="+" className="review-icon" />{pros || "Без комментария"}
                    </div>
                    <div className="review-card-cons">
                      <img src={consIcon} alt="-" className="review-icon" />{cons || "Минусов нет"}
                    </div>
                  </div>
                );
              }) : (
                <p className="details-loading">Отзывов пока нет</p>
              )}
              {reviews.length > 3 && (
                <button className="reviews-all-btn" onClick={() => setShowAllReviews(true)}>
                  Все оценки · {reviews.length}
                </button>
              )}
            </div>

            {avgRating != null && (
              <div className="reviews-overall-card">
                <strong className="reviews-overall-label">{getRatingLabel(avgRating)}</strong>
                <span className="reviews-overall-badge" style={{ background: getRatingColor(avgRating) }}>
                  {avgRating}
                </span>
                <div className="reviews-overall-count">на основе {reviewsCount} оценок</div>
              </div>
            )}
          </div>

          {token && (
            <div className="review-form-section">
              {myReview != null && (
                <div className="review-already-card">
                  <span className="review-already-label">Ваш отзыв</span>
                  <span className="review-already-badge" style={{ background: getRatingColor(myReview.rating) }}>
                    {myReview.rating}
                  </span>
                  <p className="review-already-text">{myReview.comment?.split("\n---\n")[0] || "Отличная экскурсия"}</p>
                </div>
              )}

              {myReview === null && canReview === false && (
                <p className="review-not-eligible">Оставить отзыв можно после посещения экскурсии</p>
              )}

              {myReview === null && canReview === true && (
                <>
                  <h3 className="review-form-title">Оставить отзыв</h3>
                  <div className="review-scale">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`review-scale-btn${reviewStars === n ? " review-scale-btn--active" : ""}${reviewStars > 0 && n <= reviewStars ? " review-scale-btn--filled" : ""}`}
                        onClick={() => setReviewStars(n)}
                      >
                        {n}
                      </button>
                    ))}
                    {reviewStars > 0 && (
                      <span className="review-scale-label">{getRatingLabel(reviewStars)} ({reviewStars}/10)</span>
                    )}
                  </div>
                  <div className="review-form-fields">
                    <textarea className="review-textarea" placeholder="Что понравилось..." value={reviewPros} onChange={(e) => setReviewPros(e.target.value)} rows={3} />
                    <textarea className="review-textarea" placeholder="Минусы и пожелания (необязательно)..." value={reviewCons} onChange={(e) => setReviewCons(e.target.value)} rows={2} />
                  </div>
                  {reviewError && <p className="review-form-error">{reviewError}</p>}
                  {reviewSuccess && <p className="review-form-success">Спасибо за отзыв!</p>}
                  <button
                    className="review-submit-btn"
                    disabled={reviewSubmitting || reviewStars === 0}
                    onClick={async () => {
                      if (reviewStars === 0) { setReviewError("Выберите оценку"); return; }
                      setReviewSubmitting(true);
                      setReviewError(null);
                      const comment = reviewCons.trim()
                        ? `${reviewPros.trim()}\n---\n${reviewCons.trim()}`
                        : reviewPros.trim() || null;
                      try {
                        const created = await submitReview(token, Number(id), reviewStars, comment);
                        setMyReview(created);
                        setCanReview(false);
                        const newReviews = [created, ...reviews];
                        setReviews(newReviews);
                        const newAvg = Math.round(newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length * 10) / 10;
                        setExcursion((prev) => ({ ...prev, avg_rating: newAvg, reviews_count: newReviews.length }));
                        setReviewSuccess(true);
                      } catch (e) {
                        setReviewError(e.message || "Не удалось отправить отзыв");
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                  >
                    {reviewSubmitting ? "Отправляем..." : "Отправить отзыв"}
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {showAllReviews && (
          <div className="gallery-modal-overlay" onClick={() => setShowAllReviews(false)}>
            <div className="gallery-modal-box reviews-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="gallery-modal-header">
                <span className="gallery-modal-title">Все отзывы · {reviews.length}</span>
                <button className="gallery-modal-close" onClick={() => setShowAllReviews(false)}>×</button>
              </div>
              <div className="gallery-modal-scroll reviews-modal-scroll">
                {reviews.map((r) => {
                  const [rawPros, cons] = r.comment
                    ? r.comment.split("\n---\n")
                    : ["Отличная экскурсия", null];
                  const pros = rawPros && rawPros !== "None" && rawPros !== "null" ? rawPros : null;
                  return (
                    <div key={r.review_id} className="review-card">
                      <div className="review-card-header">
                        <div className="review-card-meta">
                          <strong className="review-card-name">{r.client_name}</strong>
                          <span className="review-card-subtitle">{excursion.title} • {r.date}</span>
                        </div>
                        <span className="review-card-badge" style={{ background: getRatingColor(r.rating) }}>
                          {r.rating}
                        </span>
                      </div>
                      <div className="review-card-pros">
                        <img src={prosIcon} alt="+" className="review-icon" />{pros || "Без комментария"}
                      </div>
                      <div className="review-card-cons">
                        <img src={consIcon} alt="-" className="review-icon" />{cons || "Минусов нет"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {related.length > 0 && (
          <RelatedCarousel title={`Другие экскурсии в городе ${excursion.city}`} items={related} navigate={navigate} />
        )}
      </div>
    </div>
  );
}
