import { useState, useRef, useEffect } from "react";
import "./PeopleSelector.css";

const noun = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

function formatDisplay(adults, children) {
  const adultStr = `${adults} ${noun(adults, "взрослый", "взрослых", "взрослых")}`;
  if (children === 0) return adultStr;
  const childStr = `${children} ${noun(children, "ребёнок", "ребёнка", "детей")}`;
  return `${adultStr}, ${childStr}`;
}

function Counter({ label, hint, value, onDec, onInc, min = 0 }) {
  return (
    <div className="PeopleSelector__row">
      <div className="PeopleSelector__row-label">
        <span className="PeopleSelector__row-title">{label}</span>
        {hint && <span className="PeopleSelector__row-hint">{hint}</span>}
      </div>
      <div className="PeopleSelector__counter">
        <button
          type="button"
          className="PeopleSelector__btn"
          onClick={onDec}
          disabled={value <= min}
        >−</button>
        <span className="PeopleSelector__count">{value}</span>
        <button
          type="button"
          className="PeopleSelector__btn"
          onClick={onInc}
        >+</button>
      </div>
    </div>
  );
}

export default function PeopleSelector({ adults, children, onChange }) {
  const [open, setOpen] = useState(false);
  const [localAdults, setLocalAdults] = useState(adults);
  const [localChildren, setLocalChildren] = useState(children);
  const wrapRef = useRef(null);

  useEffect(() => {
    setLocalAdults(adults);
    setLocalChildren(children);
  }, [adults, children]);

  useEffect(() => {
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        handleApply();
      }
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, localAdults, localChildren]);

  const handleApply = () => {
    onChange({ adults: localAdults, children: localChildren });
    setOpen(false);
  };

  return (
    <div className="PeopleSelector" ref={wrapRef}>
      <span
        className="PeopleSelector__display"
        onClick={() => setOpen((v) => !v)}
      >
        {formatDisplay(adults, children)}
      </span>

      {open && (
        <div className="PeopleSelector__popup">
          <Counter
            label="Взрослые"
            value={localAdults}
            min={1}
            onDec={() => setLocalAdults((v) => Math.max(1, v - 1))}
            onInc={() => setLocalAdults((v) => v + 1)}
          />
          <Counter
            label="Дети"
            hint="до 12 лет"
            value={localChildren}
            min={0}
            onDec={() => setLocalChildren((v) => Math.max(0, v - 1))}
            onInc={() => setLocalChildren((v) => v + 1)}
          />
          <button
            type="button"
            className="PeopleSelector__apply"
            onClick={handleApply}
          >
            Применить
          </button>
        </div>
      )}
    </div>
  );
}
