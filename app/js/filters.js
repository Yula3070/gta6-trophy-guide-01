// Vice Ledger filtering: the kind chips, text search, and the spoiler rule.
//
// The spoiler guard mirrors PlayStation itself, which hides 28 of the 55
// trophies until they are earned: with the guard on, an unearned story
// trophy shows a masked name and description, and its guide stays shut.

export const KINDS = [
  { id: 'all', label: 'All 55' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'crime', label: 'Crime & Cash' },
  { id: 'online', label: 'Online' },
];

export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

export function matchesSearch(trophy, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [trophy.name, trophy.description, trophy.guide, trophy.kind]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterTrophies(trophies, { kind, query }) {
  return trophies.filter((t) => matchesKind(t, kind) && matchesSearch(t, query));
}

export function isMasked(trophy, store) {
  return store.spoiler && trophy.kind === 'story' && !store.earned[trophy.id];
}

export function displayName(trophy, store) {
  return isMasked(trophy, store) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, store) {
  return isMasked(trophy, store)
    ? 'Masked by the spoiler guard until earned.'
    : trophy.description;
}

const GROUP_ORDER = ['platinum', 'story', 'collectibles', 'activities', 'crime', 'completion'];
const GROUP_LABELS = {
  platinum: 'The Platinum',
  story: 'Story & Mission Strands',
  collectibles: 'Collectibles & Exploration',
  activities: 'Activities & Skills',
  crime: 'Crime & Cash',
  completion: '100% Completion',
};

export function groupByKind(trophies) {
  const buckets = new Map();
  for (const t of trophies) {
    const key = t.grade === 'platinum' ? 'platinum' : t.kind;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(t);
  }
  return GROUP_ORDER
    .filter((key) => buckets.has(key))
    .map((key) => ({ key, label: GROUP_LABELS[key] ?? key, items: buckets.get(key) }));
}
