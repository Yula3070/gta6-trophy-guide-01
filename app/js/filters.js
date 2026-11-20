// Vice Ledger filters: decides which trophies a view shows, and in what
// order. Pure functions over the trophy list — the views render the result.

import { GRADE_RANK, isEarned } from './store.js';

export const KINDS = ['story', 'collectible', 'activity', 'misc'];

export function defaultFilters() {
  return {
    query: '',
    grade: 'all',
    kind: 'all',
    status: 'all', // all | earned | missing
    missableOnly: false,
    sort: 'roadmap', // roadmap | grade | name | quickest
  };
}

function matchesQuery(trophy, query) {
  if (!query) return true;
  const haystack = [
    trophy.name,
    trophy.description,
    trophy.guide,
    trophy.chapter ?? '',
    trophy.kind ?? '',
    trophy.stageTitle ?? '',
  ].join(' ').toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

export function applyFilters(trophies, filters) {
  const kept = trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (filters.status === 'earned' && !isEarned(t.id)) return false;
    if (filters.status === 'missing' && isEarned(t.id)) return false;
    return matchesQuery(t, filters.query.trim());
  });
  return sortTrophies(kept, filters.sort);
}

export function sortTrophies(trophies, sort) {
  const list = [...trophies];
  switch (sort) {
    case 'grade':
      list.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id);
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'quickest':
      list.sort((a, b) => (a.estMinutes ?? 0) - (b.estMinutes ?? 0) || a.id - b.id);
      break;
    default: // roadmap: stage order first, then the order inside the stage
      list.sort((a, b) => (a.stage ?? 99) - (b.stage ?? 99) || (a.stageOrder ?? a.id) - (b.stageOrder ?? b.id));
  }
  return list;
}

export function groupByStage(trophies) {
  const stages = new Map();
  for (const t of sortTrophies(trophies, 'roadmap')) {
    const key = t.stage ?? 99;
    if (!stages.has(key)) {
      stages.set(key, { stage: key, title: t.stageTitle ?? 'Anytime', note: t.stageNote ?? '', items: [] });
    }
    stages.get(key).items.push(t);
  }
  return [...stages.values()].sort((a, b) => a.stage - b.stage);
}

export function missableTrophies(trophies) {
  return trophies
    .filter((t) => t.missable)
    .sort((a, b) => (a.stage ?? 99) - (b.stage ?? 99) || a.id - b.id);
}
