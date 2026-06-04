import { useState, useEffect, useRef } from "react";
import "./FilterDropdown.css";

export default function FilterDropdown({ label, options, value, onChange, renderLabel }) {
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
