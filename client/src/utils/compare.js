export const COMPARE_UPDATED_EVENT = 'dmnk-compare-updated';
const STORAGE_KEY = 'dmnk_compare_v1';
const MAX_COMPARE = 4;

export function getCompareIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompareIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
}

export function isInCompare(id) {
  return getCompareIds().includes(Number(id));
}

export function toggleCompare(id) {
  const numId = Number(id);
  const ids = getCompareIds();
  if (ids.includes(numId)) {
    saveCompareIds(ids.filter((i) => i !== numId));
    return { added: false, ids };
  }
  if (ids.length >= MAX_COMPARE) {
    return { added: false, limitReached: true, ids };
  }
  const next = [...ids, numId];
  saveCompareIds(next);
  return { added: true, ids: next };
}

export function removeFromCompare(id) {
  const next = getCompareIds().filter((i) => i !== Number(id));
  saveCompareIds(next);
  return next;
}

export function clearCompare() {
  saveCompareIds([]);
}

export { MAX_COMPARE };
