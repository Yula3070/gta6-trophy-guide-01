// filters.js — which trophies a view shows, and what the spoiler setting hides.
// Kinds follow the competition: story, missable, collectibles, activities, online.
// This list has no online trophies, so the online filter always matches none —
// the filter stays in the list so the kinds match the competition exactly.

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

export function isSpoilerHidden(trophy, state) {
  return state.settings.spoiler && isStoryTrophy(trophy) && !state.earned.includes(trophy.id);
}

export function applyFilters(trophies, state, criteria) {
  const query = (criteria.search ?? '').trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (criteria.kind === 'missable' && !trophy.missable) return false;
    if (criteria.kind === 'online') return false;
    if (criteria.kind && criteria.kind !== 'all' && criteria.kind !== 'missable' && criteria.kind !== 'online' && trophy.kind !== criteria.kind) return false;
    if (criteria.grade && criteria.grade !== 'all' && trophy.grade !== criteria.grade) return false;
    if (state.settings.hideEarned && state.earned.includes(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function gradeRank(grade) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[grade] ?? 4;
}

// Next Up: the easiest unearned trophy next — earliest roadmap stage first,
// then easiest grade, then the list's own order. Missable trophies that are still
// open in the current stage are suggested before later-stage ones.
export function pickNextUp(trophies, state) {
  const remaining = trophies.filter((t) => !state.earned.includes(t.id));
  if (remaining.length === 0) return null;
  remaining.sort((a, b) =>
    (a.roadmap_stage - b.roadmap_stage) ||
    (gradeRank(a.grade) - gradeRank(b.grade)) ||
    (a.id - b.id));
  return remaining[0];
}
