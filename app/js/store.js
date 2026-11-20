// Progress store for the Leonida Trophy Atlas.
// Everything a player marks lives in one localStorage record: earned trophies, partial counts,
// personal notes and the spoiler-guard setting. Export writes that record to a JSON file the
// player can keep; import reads one back. Nothing leaves the browser.

const STORAGE_KEY = 'leonida-trophy-atlas/v1';

export const DEMO_EARNED = [2, 3, 8, 9, 10, 11, 12, 16, 20, 21, 33, 44, 51];
export const DEMO_COUNTS = { 15: 96, 17: 23, 18: 5, 28: 7, 31: 41, 35: 58, 42: 31 };

function blankState() {
  return { earned: {}, counts: {}, notes: {}, spoilerGuard: false };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoilerGuard: parsed.spoilerGuard === true,
    };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the atlas still works for this visit.
  }
}

export function isEarned(state, id) {
  return state.earned[String(id)] === true;
}

export function setEarned(state, id, value) {
  if (value) state.earned[String(id)] = true;
  else delete state.earned[String(id)];
}

export function getCount(state, id) {
  const value = Number(state.counts[String(id)]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function setCount(state, id, value) {
  const clean = Math.max(0, Math.floor(Number(value) || 0));
  if (clean > 0) state.counts[String(id)] = clean;
  else delete state.counts[String(id)];
}

export function earnedTotal(state, trophies) {
  return trophies.reduce((sum, t) => sum + (isEarned(state, t.id) ? 1 : 0), 0);
}

// Screenshot scenes (?detail=, ?view=, ?spoiler=) show a lived-in tracker: when the browser has
// no saved progress yet and a scene parameter is present, seed the demo progress so the shots
// show earned trophies, partial counts and a working spoiler guard.
export function seedDemoIfScene(state, params) {
  const hasScene = params.has('detail') || params.has('view') || params.has('spoiler');
  const untouched = Object.keys(state.earned).length === 0 && Object.keys(state.counts).length === 0;
  if (!hasScene || !untouched) return state;
  for (const id of DEMO_EARNED) state.earned[String(id)] = true;
  for (const [id, value] of Object.entries(DEMO_COUNTS)) state.counts[id] = value;
  state.notes['17'] = 'Gold on the pistol and SMG lanes; shotgun lane next.';
  return state;
}

export function exportState(state) {
  return JSON.stringify(
    { app: 'leonida-trophy-atlas', version: 1, exportedAt: new Date().toISOString(), state },
    null,
    2,
  );
}

export function importState(text) {
  const parsed = JSON.parse(text);
  const inner = parsed && typeof parsed === 'object' && parsed.state ? parsed.state : parsed;
  if (!inner || typeof inner !== 'object') throw new Error('not an atlas progress file');
  const next = blankState();
  for (const [id, value] of Object.entries(inner.earned ?? {})) {
    if (value === true) next.earned[id] = true;
  }
  for (const [id, value] of Object.entries(inner.counts ?? {})) {
    const clean = Math.max(0, Math.floor(Number(value) || 0));
    if (clean > 0) next.counts[id] = clean;
  }
  for (const [id, value] of Object.entries(inner.notes ?? {})) {
    if (typeof value === 'string') next.notes[id] = value;
  }
  next.spoilerGuard = inner.spoilerGuard === true;
  return next;
}
