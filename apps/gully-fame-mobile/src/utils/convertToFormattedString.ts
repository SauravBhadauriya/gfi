export function convertToFormattedString(views: number | string | undefined) {
  // To prevent conflicts from what type of data the API sends. The intended data type should be number.
  if (typeof views !== "number") {
    return views;
  }
  if (views < 1000) return views.toString();
  if (views < 10000) {
    const formatted = (views / 1000).toFixed(1);
    return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted + "K";
  }
  if (views < 1000000) {
    return Math.floor(views / 1000) + "K";
  }
  if (views < 10000000) {
    const formatted = (views / 1000000).toFixed(1);
    return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted + "M";
  }
  return Math.floor(views / 1000000) + "M";
}
