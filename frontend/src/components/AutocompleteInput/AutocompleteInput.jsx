import { useState } from "react";
import "./AutocompleteInput.css";

export default function AutocompleteInput({ value, onChange, placeholder, suggestions = [], onSubmit }) {
  const [focused, setFocused] = useState(false);

  const filtered = value.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().startsWith(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
        .slice(0, 8)
    : [];

  const showDropdown = focused && filtered.length > 0;

  return (
    <div className="autocomplete-root">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Tab" && showDropdown) {
            onChange(filtered[0]);
          }
          if (e.key === "Enter") {
            setFocused(false);
            onSubmit?.();
          }
        }}
      />
      {showDropdown && (
        <ul className="autocomplete-dropdown">
          {filtered.map((s, i) => (
            <li key={i}>
              <button
                className="autocomplete-item"
                onMouseDown={(e) => {
                  e.preventDefault(); // не даём инпуту потерять фокус до клика
                  onChange(s);
                  setFocused(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
