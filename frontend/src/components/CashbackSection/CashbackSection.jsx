import "./CashbackSection.css";

export default function CashbackSection() {
  return (
    <section className="CashbackSection">
      <div className="CashbackSection__inner">
        <h2 className="CashbackSection__title">Путешествуйте с кэшбэком</h2>
        <p className="CashbackSection__subtitle">
          Чтобы перейти в приложение Т-Банка, наведите камеру смартфона на QR-код.
        </p>

        <div className="CashbackSection__visual">
          <div className="CashbackSection__decos CashbackSection__decos--left">
            <div className="CashbackSection__deco-sun">☀️</div>
            <div className="CashbackSection__deco-travel">
              <div className="CashbackSection__travel-card">
                <span className="CashbackSection__travel-icon">✈️</span>
                <span className="CashbackSection__travel-text">Путешествия</span>
              </div>
            </div>
            <div className="CashbackSection__deco-cloud">◇</div>
          </div>

          <div className="CashbackSection__qr-wrap">
            <div className="CashbackSection__qr-placeholder">
              <div className="CashbackSection__qr-grid">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="CashbackSection__qr-cell"
                    style={{ background: Math.random() > 0.5 ? "#000" : "#fff" }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="CashbackSection__decos CashbackSection__decos--right">
            <div className="CashbackSection__deco-tpay">
              <span>T</span>
              <span className="CashbackSection__tpay-sub">Pay</span>
            </div>
            <div className="CashbackSection__deco-triangle">▲</div>
            <div className="CashbackSection__deco-ball">●</div>
          </div>
        </div>

        <p className="CashbackSection__footnote">*SAMOLET — самолет</p>
      </div>
    </section>
  );
}