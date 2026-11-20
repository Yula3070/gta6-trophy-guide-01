// Rendering for the Leonida Trophy Atlas: the checklist cards, the detail panel with the cited
// guide, the roadmap stops and the missables list. Pure DOM building — no innerHTML with data.

import { getCount, isEarned } from './store.js';
import { groupByKind, byRoadmapStage } from './filters.js';

export const ROADMAP_STOPS = [
  {
    stage: 1,
    title: 'The Story',
    advice: 'Play the campaign first and let the chapter and mission trophies fall as they come. This is also when the one-time moments live — a cocktail on Ocean Beach, an unscheduled departure at VCIA, a showroom breakout — so keep an eye on the missable flags below before you push past a chapter.',
  },
  {
    stage: 2,
    title: 'Strands & Strangers',
    advice: 'Finish every character strand (Andy, Kenton, Billy, Randy, Tyrone, Cal, Bret) and eight stranger strands across Leonida. In this series strands can close as chapters advance, so clear them while their givers are still around rather than saving them for the end.',
  },
  {
    stage: 3,
    title: 'Activities & Skills',
    advice: 'Sweep the repeatable work: gold medals at the Shooting Range, drone races at every Top Fun location, twenty race wins, 250 stunts, fifty challenges, an arcade clear and a Combat Focus multikill. All of it stays available in free roam.',
  },
  {
    stage: 4,
    title: 'Collectibles & Exploration',
    advice: 'The long hunts: meditation spots, collectible card sets, 100 WAiNK locations, 100 discovered vehicles, every one of Leonida\'s 52 areas, all garage properties and ten vehicles on the Scooter Bros app. Work district by district so nothing is backtracked twice.',
  },
  {
    stage: 5,
    title: 'Crime & Cash',
    advice: 'Rob five bank vaults, an armored truck and a jewelry store unseen, hit one illegal operation from each of the nine gangs, then turn the take into progress: launder $250,000 in marked bills and spend $100,000 across the shops. Partner trophies sit here too — do them while your partner is still riding with you.',
  },
  {
    stage: 6,
    title: '100% & Platinum',
    advice: 'With the story, strands, activities, collectibles and crime done, the completion percentage should be within reach of 100%. A Long Road (gold) lands first, and Vice Got a Price! — the platinum — follows the moment the other 54 are yours.',
  },
];

const TROPHY_PATH = 'M14 6h20v6h7v3c0 6-4 10-9 11a13 13 0 0 1-8 5.6V36h5v4H19v-4h5v-4.4A13 13 0 0 1 16 26C11 25 7 21 7 15v-3h7V6Zm-4 9c.4 3 2 5 4.6 5.6A14 14 0 0 1 14 15h-4Zm28 0h-4a14 14 0 0 1-.6 5.6C36 20 37.6 18 38 15Z';

export function gradeBadge(grade) {
  const span = document.createElement('span');
  span.className = `grade-badge grade-${grade}`;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 48 48"><path d="${TROPHY_PATH}" fill="currentColor"/></svg>`;
  return span;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function isMasked(trophy, state) {
  return state.spoilerGuard && trophy.kind === 'story' && !isEarned(state, trophy.id);
}

export function displayName(trophy, state) {
  return isMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isMasked(trophy, state)
    ? 'Spoiler guard is on: earn this story trophy to reveal its name and description.'
    : trophy.description;
}

function trophyTags(trophy, state) {
  const wrap = el('div', 'trophy-meta');
  if (trophy.missable) wrap.append(el('span', 'tag tag-missable', 'Missable'));
  if (trophy.hidden) wrap.append(el('span', 'tag tag-hidden', 'Hidden on PSN'));
  if (trophy.count) {
    const done = getCount(state, trophy.id);
    wrap.append(el('span', 'tag tag-count', `${done} / ${trophy.count.target} ${trophy.count.unit}`));
  }
  wrap.append(el('span', 'tag tag-stage', `Roadmap stop ${trophy.stage}`));
  return wrap;
}

export function trophyCard(trophy, state, { selected, onSelect, onToggle }) {
  const card = el('article', 'trophy-card');
  if (isEarned(state, trophy.id)) card.classList.add('is-earned');
  if (selected) card.classList.add('is-selected');
  card.append(gradeBadge(trophy.grade));

  const main = el('div', 'trophy-main');
  main.append(el('div', 'trophy-name', displayName(trophy, state)));
  main.append(el('div', 'trophy-desc', displayDescription(trophy, state)));
  main.append(trophyTags(trophy, state));
  card.append(main);

  const box = el('label', 'earned-box');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isEarned(state, trophy.id);
  checkbox.setAttribute('aria-label', `Mark ${displayName(trophy, state)} as earned`);
  checkbox.addEventListener('click', (event) => event.stopPropagation());
  checkbox.addEventListener('change', () => onToggle(trophy.id, checkbox.checked));
  box.append(checkbox);
  card.append(box);

  card.addEventListener('click', () => onSelect(trophy.id));
  return card;
}

export function renderChecklist(root, trophies, state, handlers) {
  root.replaceChildren();
  for (const group of groupByKind(trophies)) {
    const earnedHere = group.items.filter((t) => isEarned(state, t.id)).length;
    const heading = el('h2', 'kind-heading');
    heading.append(document.createTextNode(group.title));
    heading.append(el('span', 'kind-progress', `${earnedHere} / ${group.items.length}`));
    root.append(heading);
    for (const trophy of group.items) {
      root.append(trophyCard(trophy, state, { selected: handlers.selectedId === trophy.id, ...handlers }));
    }
  }
}

export function renderMissables(root, trophies, state, handlers) {
  root.replaceChildren();
  const flagged = trophies.filter((t) => t.missable).sort((a, b) => a.id - b.id);
  const heading = el('h2', 'kind-heading');
  heading.append(document.createTextNode('Missable trophies'));
  heading.append(el('span', 'kind-progress', `${flagged.length} flagged from the official descriptions`));
  root.append(heading);
  for (const trophy of flagged) {
    const card = trophyCard(trophy, state, { selected: handlers.selectedId === trophy.id, ...handlers });
    const why = el('p', 'trophy-desc', trophy.missableWhy);
    why.style.marginTop = '6px';
    card.querySelector('.trophy-main').append(why);
    root.append(card);
  }
}

export function renderDetail(pane, trophy, state, handlers) {
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'detail-empty', 'Pick a trophy from the list to see its guide, sources and tracking.'));
    return;
  }
  const earned = isEarned(state, trophy.id);
  const masked = isMasked(trophy, state);

  const gradeLine = el('div', 'detail-grade');
  gradeLine.append(gradeBadge(trophy.grade));
  gradeLine.append(el('span', '', `${trophy.grade} · ${trophy.kind === 'platinum' ? 'platinum' : trophy.kind} · roadmap stop ${trophy.stage}`));
  pane.append(gradeLine);
  pane.append(el('h2', '', displayName(trophy, state)));
  pane.append(el('p', 'detail-desc', `“${displayDescription(trophy, state)}” — official description`));
  pane.append(trophyTags(trophy, state));

  if (trophy.missable) {
    const alert = el('div', 'missable-alert');
    alert.append(el('b', '', 'Missable. '));
    alert.append(document.createTextNode(trophy.missableWhy));
    pane.append(alert);
  }

  if (masked) {
    pane.append(el('h3', '', 'Guide'));
    pane.append(el('p', '', 'Hidden by the spoiler guard. Earn it in the story, or switch the guard off in the toolbar, to read the guide.'));
  } else {
    pane.append(el('h3', '', 'Guide'));
    pane.append(el('p', '', trophy.guide));
    if (trophy.steps?.length) {
      pane.append(el('h3', '', 'Steps'));
      const list = el('ol');
      for (const step of trophy.steps) list.append(el('li', '', step));
      pane.append(list);
    }
    if (trophy.sources?.length) {
      pane.append(el('h3', '', 'Sources'));
      const list = el('ul', 'sources-list');
      for (const source of trophy.sources) {
        const item = el('li');
        const link = el('a', '', source.label);
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(link);
        list.append(item);
      }
      pane.append(list);
    }
  }

  const actions = el('div', 'detail-actions');
  const earnedLabel = el('label');
  const earnedBox = document.createElement('input');
  earnedBox.type = 'checkbox';
  earnedBox.checked = earned;
  earnedBox.addEventListener('change', () => handlers.onToggle(trophy.id, earnedBox.checked));
  earnedLabel.append(earnedBox, document.createTextNode('Earned'));
  actions.append(earnedLabel);
  pane.append(actions);

  if (trophy.count) {
    const tracker = el('div', 'count-tracker');
    tracker.append(el('span', '', 'Progress:'));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.count.target);
    input.value = String(getCount(state, trophy.id));
    input.setAttribute('aria-label', `Your ${trophy.count.unit} so far`);
    input.addEventListener('change', () => handlers.onCount(trophy.id, input.value));
    tracker.append(input, el('span', '', `/ ${trophy.count.target} ${trophy.count.unit}`));
    pane.append(tracker);
  }

  const notes = el('div', 'notes-box');
  notes.append(el('h3', '', 'Your notes'));
  const area = document.createElement('textarea');
  area.placeholder = 'Where you left off, a route that worked…';
  area.value = state.notes[String(trophy.id)] ?? '';
  area.addEventListener('change', () => handlers.onNote(trophy.id, area.value));
  notes.append(area);
  pane.append(notes);
}

export function renderRoadmap(pane, trophies, state, handlers) {
  pane.replaceChildren();
  pane.append(el('p', 'roadmap-intro', 'Six stops from first mission to platinum, ordered so nothing missable is left behind: story first, strands while their givers are still around, then the repeatable work, the hunts, the crime, and the completion sweep. Tap any trophy to open its guide.'));
  const stages = byRoadmapStage(trophies);
  for (const stop of ROADMAP_STOPS) {
    const items = stages.get(stop.stage) ?? [];
    const earnedHere = items.filter((t) => isEarned(state, t.id)).length;
    const card = el('article', 'stop-card');
    const head = el('div', 'stop-head');
    const title = el('h2');
    title.append(el('span', 'stop-no', `Stop ${stop.stage} — `), document.createTextNode(stop.title));
    head.append(title, el('span', 'stop-progress', `${earnedHere} / ${items.length} earned`));
    card.append(head);
    const bar = el('div', 'stop-bar');
    const fill = el('span');
    fill.style.width = items.length ? `${(earnedHere / items.length) * 100}%` : '0%';
    bar.append(fill);
    card.append(bar);
    card.append(el('p', 'stop-advice', stop.advice));
    const chips = el('div', 'stop-trophies');
    for (const trophy of items) {
      const chip = el('button', 'stop-chip');
      chip.type = 'button';
      if (isEarned(state, trophy.id)) chip.classList.add('is-earned');
      chip.append(gradeBadge(trophy.grade), document.createTextNode(displayName(trophy, state)));
      if (trophy.missable) chip.append(el('span', 'warn-dot', '!'));
      chip.addEventListener('click', () => handlers.onSelect(trophy.id, 'checklist'));
      chips.append(chip);
    }
    card.append(chips);
    pane.append(card);
  }
}

export function renderProgress(trophies, state) {
  const earned = trophies.filter((t) => isEarned(state, t.id)).length;
  document.getElementById('earned-count').textContent = String(earned);
  document.getElementById('earned-percent').textContent = `${Math.round((earned / trophies.length) * 100)}%`;
  const bar = document.getElementById('progress-bar');
  bar.setAttribute('aria-valuenow', String(earned));
  document.getElementById('progress-fill').style.width = `${(earned / trophies.length) * 100}%`;
  const tally = document.getElementById('grade-tally');
  tally.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && isEarned(state, t.id)).length;
    const item = el('li');
    item.append(el('b', '', `${got}/${total}`), document.createTextNode(` ${grade}`));
    tally.append(item);
  }
  document.getElementById('missable-count').textContent = String(trophies.filter((t) => t.missable).length);
}

export function renderNextUp(trophies, state, onSelect) {
  const strip = document.getElementById('next-up');
  const next = trophies
    .filter((t) => !isEarned(state, t.id) && t.kind !== 'platinum')
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id))[0];
  if (!next) {
    strip.hidden = true;
    return;
  }
  strip.hidden = false;
  strip.replaceChildren();
  strip.append(document.createTextNode('Next up on the roadmap: '));
  strip.append(el('b', '', displayName(next, state)));
  strip.append(document.createTextNode(` (stop ${next.stage}${next.missable ? ', missable — do not leave it behind' : ''})`));
  const button = el('button', '', 'Open guide');
  button.type = 'button';
  button.addEventListener('click', () => onSelect(next.id, 'checklist'));
  strip.append(button);
}
