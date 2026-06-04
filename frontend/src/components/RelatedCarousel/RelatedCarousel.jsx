import React from "react";
import { useNavigate } from "react-router-dom";
import ExcursionCard from "../ExcursionCard/ExcursionCard";
import "./RelatedCarousel.css";

export default function RelatedCarousel({ title, items }) {
  const navigate = useNavigate();
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
