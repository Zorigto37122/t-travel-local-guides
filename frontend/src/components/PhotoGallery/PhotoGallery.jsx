import React from "react";
import "./PhotoGallery.css";

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

export default function PhotoGallery({ photos, title }) {
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
