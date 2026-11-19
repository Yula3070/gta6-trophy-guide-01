// store.js — saved progress for the Leonida Ledger: earned trophies, per-trophy notes,
// per-trophy count progress, and settings, all in localStorage; plus JSON export/import.
// Nothing here touches the network: the file is written locally and read back locally.

export const STORAGE_KEY = 'leonida-ledger-v1';

export function blankState() {
  return {
    version: 1,
    earned: [],
    notes: {},
    counts: {},
    settings: { spoiler: false, hideEarned: false },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const state = blankState();
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((id) => Number.isInteger(id));
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
    if (parsed.settings && typeof parsed.settings === 'object') {
      state.settings.spoiler = parsed.settings.spoiler === true;
      state.settings.hideEarned = parsed.settings.hideEarned === true;
    }
    return state;
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function toggleEarned(state, trophyId) {
  const at = state.earned.indexOf(trophyId);
  if (at === -1) state.earned.push(trophyId);
  else state.earned.splice(at, 1);
  saveState(state);
}

export function setNote(state, trophyId, text) {
  if (text.trim() === '') delete state.notes[trophyId];
  else state.notes[trophyId] = text;
  saveState(state);
}

export function getNote(state, trophyId) {
  return state.notes[trophyId] ?? '';
}

export function setCount(state, trophyId, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n === 0) delete state.counts[trophyId];
  else state.counts[trophyId] = n;
  saveState(state);
}

export function getCount(state, trophyId) {
  return state.counts[trophyId] ?? 0;
}

export function exportStateAsJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importStateFromJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a JSON object.');
  const state = blankState();
  if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((id) => Number.isInteger(id));
  if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
  if (parsed.counts && typeof parsed.counts === 'object') state.counts = parsed.counts;
  if (parsed.settings && typeof parsed.settings === 'object') {
    state.settings.spoiler = parsed.settings.spoiler === true;
    state.settings.hideEarned = parsed.settings.hideEarned === true;
  }
  return state;
}

export function downloadProgressFile(state) {
  const blob = new Blob([exportStateAsJson(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}
