export const getRatingColor = (r) => {
  if (r >= 8) return "#00c853";
  if (r >= 6) return "#c8b400";
  if (r >= 4) return "#ff9800";
  return "#f44336";
};

export const getRatingLabel = (r) => {
  if (r >= 9) return "Превосходно";
  if (r >= 8) return "Отлично";
  if (r >= 7) return "Хорошо";
  if (r >= 6) return "Неплохо";
  if (r >= 5) return "Удовлетворительно";
  return "Плохо";
};
