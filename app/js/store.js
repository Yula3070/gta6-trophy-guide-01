// Vice Ledger store: loads the trophy data and keeps the player's progress.
// Progress is a set of earned trophy ids, saved in localStorage under one
// key, and portable as a small JSON file through export/import.

const PROGRESS_KEY = 'vice-ledger-progress-v1';
const SETTINGS_KEY = 'vice-ledger-settings-v1';

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

let trophies = [];
let earnedIds = new Set();
let settings = { spoilerShield: true };

export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophy data failed to load (${response.status})`);
  const doc = await response.json();
  trophies = Array.isArray(doc) ? doc : doc.trophies;
  return trophies;
}

export function allTrophies() {
  return trophies;
}

export function trophyById(id) {
  return trophies.find((t) => t.id === id) ?? null;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    earnedIds = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    earnedIds = new Set();
  }
  return earnedIds;
}

export function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

export function isEarned(id) {
  return earnedIds.has(id);
}

export function setEarned(id, earned) {
  if (earned) earnedIds.add(id);
  else earnedIds.delete(id);
  saveProgress();
}

export function earnedCount() {
  return earnedIds.size;
}

export function exportProgress() {
  return {
    app: 'vice-ledger',
    exportedAt: new Date().toISOString(),
    earned: [...earnedIds].sort((a, b) => a - b),
  };
}

export function importProgress(payload) {
  const list = Array.isArray(payload) ? payload : payload?.earned;
  if (!Array.isArray(list)) throw new Error('that file does not hold Vice Ledger progress');
  const known = new Set(trophies.map((t) => t.id));
  earnedIds = new Set(list.filter((id) => known.has(id)));
  saveProgress();
  return earnedIds.size;
}

export function resetProgress() {
  earnedIds = new Set();
  saveProgress();
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = { ...settings, ...JSON.parse(raw) };
  } catch {
    /* keep defaults */
  }
  return settings;
}

export function saveSettings(next) {
  settings = { ...settings, ...next };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

export function progressStats() {
  const perGrade = Object.fromEntries(GRADES.map((g) => [g, { earned: 0, total: 0 }]));
  let minutesLeft = 0;
  for (const t of trophies) {
    const bucket = perGrade[t.grade];
    if (bucket) {
      bucket.total += 1;
      if (earnedIds.has(t.id)) bucket.earned += 1;
    }
    if (!earnedIds.has(t.id)) minutesLeft += t.estMinutes ?? 0;
  }
  const total = trophies.length;
  const earned = earnedIds.size;
  return {
    earned,
    total,
    percent: total === 0 ? 0 : Math.round((earned / total) * 100),
    perGrade,
    minutesLeft,
    missablesLeft: trophies.filter((t) => t.missable && !earnedIds.has(t.id)).length,
  };
}
