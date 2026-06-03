export const getRatingColor = (r) => {
  if (r >= 8) return "#00c853";
  if (r >= 6) return "#c8b400";
  if (r >= 4) return "#ff9800";
  return "#f44336";
};
