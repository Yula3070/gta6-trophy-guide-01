// Filtering and ordering for the trophy list.
// Kinds follow the official descriptions: story missions and strands, collectible hunts,
// repeatable activities, and the two capstones (100% completion, platinum). "Missable" is a
// cross-cutting flag, and "online" exists as a filter because the bounty names it — the official
// 55-trophy list contains no online trophies, so that filter honestly comes up empty.

export const KIND_FILTERS = [
  { key: 'all', label: 'All 55' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'online', label: 'Online' },
];

export const KIND_TITLES = {
  platinum: 'The Platinum',
  story: 'Story & Mission Strands',
  collectibles: 'Collectibles & Exploration',
  activities: 'Activities, Crime & Moments',
  completion: 'The Long Haul',
};

const KIND_ORDER = ['platinum', 'story', 'collectibles', 'activities', 'completion'];
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'online') return trophy.kind === 'online';
  return trophy.kind === kind;
}

export function matchesSearch(trophy, needle) {
  if (!needle) return true;
  const haystack = [
    trophy.name,
    trophy.description,
    trophy.guide,
    ...(trophy.steps ?? []),
    trophy.missableWhy ?? '',
  ].join(' ').toLowerCase();
  return needle.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

export function applyFilters(trophies, { kind, search }) {
  return trophies.filter((t) => matchesKind(t, kind) && matchesSearch(t, search));
}

// Grouped view for the checklist: kinds in roadmap order, grades best-first inside each kind,
// official list order as the tiebreak.
export function groupByKind(trophies) {
  const groups = [];
  for (const kind of KIND_ORDER) {
    const items = trophies
      .filter((t) => t.kind === kind)
      .sort((a, b) => (GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]) || (a.id - b.id));
    if (items.length) groups.push({ kind, title: KIND_TITLES[kind], items });
  }
  return groups;
}

export function byRoadmapStage(trophies) {
  const stages = new Map();
  for (const t of trophies) {
    if (!stages.has(t.stage)) stages.set(t.stage, []);
    stages.get(t.stage).push(t);
  }
  for (const items of stages.values()) items.sort((a, b) => a.id - b.id);
  return stages;
}
