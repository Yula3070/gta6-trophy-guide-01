// Vice Ledger progress store.
//
// Everything the tracker remembers — earned flags, per-trophy counters,
// personal notes, and the spoiler-guard setting — lives in the browser's
// localStorage under a single key. Nothing is sent anywhere; the export
// button is the only way progress leaves, as a JSON file the reader saves.

const STORAGE_KEY = 'vice-ledger-v1';

const emptyStore = () => ({ earned: {}, counts: {}, notes: {}, spoiler: false });

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    return emptyStore();
  }
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage blocked or full: the guide still works for this visit.
  }
}

export function toggleEarned(store, id) {
  if (store.earned[id]) delete store.earned[id];
  else store.earned[id] = true;
  saveStore(store);
}

export function setCount(store, id, value, target) {
  const clamped = Math.max(0, Math.min(target ?? value, value));
  store.counts[id] = clamped;
  if (target && clamped >= target) store.earned[id] = true;
  saveStore(store);
}

export function setNote(store, id, text) {
  if (text.trim()) store.notes[id] = text;
  else delete store.notes[id];
  saveStore(store);
}

export function exportProgress(store) {
  const payload = JSON.stringify({ app: 'vice-ledger', version: 1, ...store }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vice-ledger-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function importProgress(file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const store = { ...emptyStore(), ...parsed };
      delete store.app;
      delete store.version;
      saveStore(store);
      done(store, null);
    } catch (err) {
      done(null, err);
    }
  };
  reader.readAsText(file);
}

export function resetProgress() {
  const store = emptyStore();
  saveStore(store);
  return store;
}
