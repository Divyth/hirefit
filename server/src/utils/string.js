export function normalizeText(text = '') {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
