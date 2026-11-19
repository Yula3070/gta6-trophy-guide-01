// views.js — renders the checklist, the trophy detail panel, the roadmap and the
// missable list. All text comes from app/data/trophies.json plus the saved state;
// nothing is fetched from the network.

import { getCount, getNote, isEarned, setCount, setNote, toggleEarned } from './store.js';
import { applyFilters, isSpoilerHidden, pickNextUp } from './filters.js';
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABELS = { story: 'Story', activities: 'Activities', collectibles: 'Collectibles' };

export function trophyDisplayName(trophy, state) {
  if (isSpoilerHidden(trophy, state)) return 'Hidden story trophy';
  return trophy.name;
}

export function trophyDisplayDescription(trophy, state) {
  if (isSpoilerHidden(trophy, state)) return 'Earn this trophy to reveal its name and description.';
  return trophy.description;
}

function medalDot(trophy) {
  const dot = document.createElement('span');
  dot.className = `medal ${trophy.grade}`;
  dot.title = GRADE_LABELS[trophy.grade];
  return dot;
}

function trophyMetaLine(trophy, state) {
  const parts = [];
  if (trophy.missable) parts.push(['⚠ Missable', 'flag-missable']);
  if (trophy.count) parts.push([`${trophy.count} ${trophy.count_label}`, 'flag-count']);
  parts.push([`Roadmap stage ${trophy.roadmap_stage}`, null]);
  parts.push([KIND_LABELS[trophy.kind] ?? trophy.kind, null]);
  return parts;
}

export function renderProgress(trophies, state) {
  const earnedCount = state.earned.length;
  document.getElementById('progressText').textContent = `${earnedCount} of ${trophies.length} earned`;
  document.getElementById('progressPct').textContent = `${Math.round((earnedCount / trophies.length) * 100)}%`;
  document.getElementById('progressFill').style.width = `${(earnedCount / trophies.length) * 100}%`;
  const perGrade = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && isEarned(state, t.id)).length;
    return `${GRADE_LABELS[grade]} ${got}/${total}`;
  });
  document.getElementById('gradeCounts').textContent = perGrade.join(' · ');
  document.getElementById('missableTabCount').textContent =
    `(${trophies.filter((t) => t.missable).length})`;
}

export function renderNextUp(trophies, state, onSelect) {
  const box = document.getElementById('nextUp');
  box.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Next Up';
  box.append(heading);
  const next = pickNextUp(trophies, state);
  const p = document.createElement('p');
  if (!next) {
    p.textContent = 'All 55 trophies earned — Leonida Legend. The platinum is yours.';
  } else {
    p.append(document.createTextNode('Easiest trophy still open: '));
    const name = document.createElement('span');
    name.className = 'next-name';
    // Spoiler mode hides a story trophy's name here too, like the checklist does.
    name.textContent = trophyDisplayName(next, state);
    name.addEventListener('click', () => onSelect(next.id));
    p.append(name);
    p.append(document.createTextNode(
      ` — ${GRADE_LABELS[next.grade]}, roadmap stage ${next.roadmap_stage}. ${trophyDisplayDescription(next, state)}`));
  }
  box.append(p);
}

export function renderChecklist(trophies, state, criteria, selectedId, onSelect, onRerender) {
  const view = document.getElementById('listView');
  view.replaceChildren();
  const visible = applyFilters(trophies, state, criteria);
  if (visible.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'list-empty';
    empty.textContent = criteria.kind === 'online'
      ? 'No online trophies: this game lists no online trophies, so all 55 are earned in single-player.'
      : 'No trophies match these filters.';
    view.append(empty);
    return;
  }
  for (const trophy of visible) {
    const row = document.createElement('div');
    row.className = 'trophy-row' + (isEarned(state, trophy.id) ? ' earned' : '') +
      (selectedId === trophy.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, trophy.id);
    box.setAttribute('aria-label', `Earned: ${trophyDisplayName(trophy, state)}`);
    box.addEventListener('change', () => {
      toggleEarned(state, trophy.id);
      onRerender();
    });
    row.append(box, medalDot(trophy));
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name' + (isSpoilerHidden(trophy, state) ? ' spoiler-hidden' : '');
    name.textContent = trophyDisplayName(trophy, state);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = trophyDisplayDescription(trophy, state);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    for (const [text, cls] of trophyMetaLine(trophy, state)) {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      span.textContent = text;
      meta.append(span, document.createTextNode(' · '));
    }
    meta.lastChild.remove();
    if (trophy.count) {
      const have = getCount(state, trophy.id);
      meta.append(document.createTextNode(' · '));
      const countSpan = document.createElement('span');
      countSpan.textContent = `Your progress: ${have}/${trophy.count}`;
      meta.append(countSpan);
    }
    body.append(name, desc, meta);
    row.append(body);
    const tag = document.createElement('span');
    tag.className = `grade-tag ${trophy.grade}`;
    tag.textContent = GRADE_LABELS[trophy.grade];
    row.append(tag);
    row.addEventListener('click', (event) => {
      if (event.target === box) return;
      onSelect(trophy.id);
    });
    view.append(row);
  }
}

export function renderDetail(trophies, state, selectedId, onRerender) {
  const panel = document.getElementById('detailPanel');
  panel.replaceChildren();
  const trophy = trophies.find((t) => t.id === selectedId);
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Pick a trophy from the list to see its guide, sources and your notes.';
    panel.append(empty);
    return;
  }
  const hidden = isSpoilerHidden(trophy, state);
  const title = document.createElement('h2');
  title.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  panel.append(title);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? 'Spoiler mode hides this story trophy until you earn it.'
    : `“${trophy.description}” — ${GRADE_LABELS[trophy.grade]} trophy`;
  panel.append(official);
  if (!hidden) {
    const guideHeading = document.createElement('h3');
    guideHeading.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    panel.append(guideHeading, guide);
    const sourcesHeading = document.createElement('h3');
    sourcesHeading.textContent = 'Sources';
    const sources = document.createElement('ul');
    sources.className = 'sources';
    for (const source of trophy.sources) {
      const li = document.createElement('li');
      li.textContent = source;
      sources.append(li);
    }
    panel.append(sourcesHeading, sources);
    if (trophy.missable) {
      const warnHeading = document.createElement('h3');
      warnHeading.textContent = 'Missable';
      const warn = document.createElement('p');
      warn.className = 'warn';
      warn.textContent = trophy.missable_reason;
      panel.append(warnHeading, warn);
    }
    if (trophy.count) {
      const countHeading = document.createElement('h3');
      countHeading.textContent = 'Your count';
      const countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.min = '0';
      countInput.max = String(trophy.count);
      countInput.value = String(getCount(state, trophy.id));
      countInput.setAttribute('aria-label', `Your progress toward ${trophy.count} ${trophy.count_label}`);
      countInput.addEventListener('change', () => {
        setCount(state, trophy.id, countInput.value);
        onRerender();
      });
      const countLabel = document.createElement('p');
      countLabel.textContent = `of ${trophy.count} ${trophy.count_label}`;
      panel.append(countHeading, countInput, countLabel);
    }
  }
  const notesHeading = document.createElement('h3');
  notesHeading.textContent = 'Your notes';
  const notes = document.createElement('textarea');
  notes.placeholder = 'Your own notes for this trophy…';
  notes.value = getNote(state, trophy.id);
  notes.addEventListener('change', () => {
    setNote(state, trophy.id, notes.value);
    onRerender();
  });
  panel.append(notesHeading, notes);
}

export function renderRoadmap(data, state, onSelect) {
  const view = document.getElementById('listView');
  view.replaceChildren();
  for (const stage of data.roadmap) {
    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    const heading = document.createElement('h2');
    heading.textContent = stage.title;
    const sub = document.createElement('p');
    sub.className = 'stage-sub';
    sub.textContent = stage.subtitle;
    const advice = document.createElement('p');
    advice.className = 'stage-advice';
    advice.textContent = stage.advice;
    const members = data.trophies.filter((t) => t.roadmap_stage === stage.stage);
    const done = members.filter((t) => isEarned(state, t.id)).length;
    const progress = document.createElement('p');
    progress.className = 'stage-progress';
    progress.textContent = `${done} of ${members.length} earned in this stop`;
    const list = document.createElement('ul');
    for (const trophy of members) {
      const li = document.createElement('li');
      const link = document.createElement('span');
      link.className = 'next-name';
      link.textContent = trophyDisplayName(trophy, state);
      link.addEventListener('click', () => onSelect(trophy.id));
      li.append(link);
      li.append(document.createTextNode(
        ` — ${GRADE_LABELS[trophy.grade]}${trophy.missable ? ' · ⚠ Missable' : ''}${isEarned(state, trophy.id) ? ' · ✓ earned' : ''}`));
      list.append(li);
    }
    section.append(heading, sub, advice, progress, list);
    view.append(section);
  }
}

export function renderMissable(trophies, state, onSelect) {
  const view = document.getElementById('listView');
  view.replaceChildren();
  const intro = document.createElement('p');
  intro.className = 'missable-intro';
  intro.textContent = '21 trophies are tied to a story moment that may not come back: named missions, ' +
    'chapter completions, the final mission, partner moments and story choices. Mission replay ' +
    'availability is unconfirmed at launch, so do each one when the story presents it — ' +
    'every flag below quotes the official description as its reason.';
  view.append(intro);
  const flagged = trophies.filter((t) => t.missable);
  for (const trophy of flagged) {
    const row = document.createElement('div');
    row.className = 'trophy-row' + (isEarned(state, trophy.id) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, trophy.id);
    box.setAttribute('aria-label', `Earned: ${trophy.name}`);
    box.addEventListener('change', () => {
      toggleEarned(state, trophy.id);
      onSelect(trophy.id);
    });
    row.append(box, medalDot(trophy));
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = trophyDisplayName(trophy, state);
    const reason = document.createElement('div');
    reason.className = 'trophy-desc';
    reason.textContent = trophy.missable_reason;
    body.append(name, reason);
    row.append(body);
    const tag = document.createElement('span');
    tag.className = `grade-tag ${trophy.grade}`;
    tag.textContent = GRADE_LABELS[trophy.grade];
    row.append(tag);
    row.addEventListener('click', (event) => {
      if (event.target === box) return;
      onSelect(trophy.id);
    });
    view.append(row);
  }
}
