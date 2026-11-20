// Vice Ledger views: turns trophy data into the checklist, the roadmap, the
// missables board and the detail panel. Rendering only — state lives in
// store.js, selection logic in filters.js, wiring in main.js.

import { GRADES, isEarned, progressStats } from './store.js';
import { groupByStage, missableTrophies } from './filters.js';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', collectible: 'Collectible', activity: 'Activity', misc: 'Misc' };

export function formatMinutes(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function shielded(trophy, settings) {
  return settings.spoilerShield && trophy.kind === 'story' && !isEarned(trophy.id);
}

export function displayName(trophy, settings) {
  return shielded(trophy, settings) ? 'Hidden story trophy' : trophy.name;
}

function chip(text, className) {
  return el('span', `chip ${className ?? ''}`.trim(), text);
}

function trophyChips(trophy, settings) {
  const wrap = el('div', 'trophy-meta');
  wrap.append(chip(GRADE_LABEL[trophy.grade], `grade-${trophy.grade}`));
  wrap.append(chip(KIND_LABEL[trophy.kind] ?? trophy.kind));
  if (trophy.missable) wrap.append(chip('Missable', 'missable'));
  if (shielded(trophy, settings)) wrap.append(chip('Spoiler shield', 'spoiler'));
  if (trophy.chapter) wrap.append(chip(trophy.chapter));
  return wrap;
}

export function renderSummary() {
  const stats = progressStats();
  document.getElementById('progressPct').textContent = `${stats.percent}%`;
  document.getElementById('progressCount').textContent = `${stats.earned} of ${stats.total} earned`;
  const counts = document.getElementById('gradeCounts');
  counts.replaceChildren();
  for (const grade of GRADES) {
    const li = el('li');
    li.append(el('span', null, `${GRADE_LABEL[grade]} `));
    li.append(el('b', null, `${stats.perGrade[grade].earned}/${stats.perGrade[grade].total}`));
    counts.append(li);
  }
  const left = document.getElementById('timeLeft');
  left.textContent = stats.minutesLeft > 0
    ? `About ${formatMinutes(stats.minutesLeft)} of trophy hunting left`
    : 'Ledger complete — platinum earned.';
  const badge = document.getElementById('missableBadge');
  badge.textContent = stats.missablesLeft > 0 ? String(stats.missablesLeft) : '';
  badge.hidden = stats.missablesLeft === 0;
}

function trophyRow(trophy, settings, selectedId, onToggle, onSelect) {
  const row = el('article', `trophy-row${isEarned(trophy.id) ? ' earned' : ''}${trophy.id === selectedId ? ' selected' : ''}`);
  row.dataset.grade = trophy.grade;
  row.tabIndex = 0;
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(trophy.id);
  box.setAttribute('aria-label', `Mark ${displayName(trophy, settings)} earned`);
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', () => onToggle(trophy.id, box.checked));
  const body = el('div');
  body.append(el('div', 'trophy-name', displayName(trophy, settings)));
  body.append(el('div', 'trophy-desc',
    shielded(trophy, settings) ? 'Description hidden until earned — spoiler shield is on.' : trophy.description));
  body.append(trophyChips(trophy, settings));
  const side = el('div', 'row-side');
  side.append(el('div', null, formatMinutes(trophy.estMinutes)));
  side.append(el('div', null, trophy.difficulty ?? ''));
  row.append(box, body, side);
  row.addEventListener('click', () => onSelect(trophy.id));
  row.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(trophy.id); }
  });
  return row;
}

export function renderChecklist(container, trophies, settings, selectedId, handlers) {
  container.replaceChildren();
  if (trophies.length === 0) {
    container.append(el('div', 'empty', 'No trophies match those filters. Loosen one and the ledger fills again.'));
    return;
  }
  const grouped = handlers.grouped;
  if (!grouped) {
    for (const t of trophies) container.append(trophyRow(t, settings, selectedId, handlers.onToggle, handlers.onSelect));
    return;
  }
  for (const stage of groupByStage(trophies)) {
    container.append(el('h2', 'stage-heading', stage.title));
    if (stage.note) container.append(el('p', 'stage-note', stage.note));
    for (const t of stage.items) container.append(trophyRow(t, settings, selectedId, handlers.onToggle, handlers.onSelect));
  }
}

export function renderRoadmap(container, trophies, settings, onSelect) {
  container.replaceChildren();
  const intro = el('p', 'stage-note',
    'The efficient order: play the story chapter by chapter, grabbing each chapter\'s trophies as its missions open them, then sweep the collectibles and activities, finish 100% completion, and the platinum closes the ledger.');
  container.append(intro);
  for (const stage of groupByStage(trophies)) {
    const card = el('section', 'roadmap-stage');
    card.append(el('h3', null, stage.title));
    if (stage.note) card.append(el('p', 'stage-goal', stage.note));
    const list = el('ol');
    for (const t of stage.items) {
      const li = el('li', isEarned(t.id) ? 'earned' : '');
      const link = el('a', null, displayName(t, settings));
      link.href = '#';
      link.addEventListener('click', (event) => { event.preventDefault(); onSelect(t.id); });
      li.append(link);
      li.append(el('span', null, ` — ${GRADE_LABEL[t.grade]}${t.missable ? ' · missable' : ''} · ${formatMinutes(t.estMinutes)}`));
      list.append(li);
    }
    card.append(list);
    const done = stage.items.filter((t) => isEarned(t.id)).length;
    const bar = el('div', 'stage-bar');
    const fill = el('div', 'stage-bar-fill');
    fill.style.width = `${stage.items.length === 0 ? 0 : Math.round((done / stage.items.length) * 100)}%`;
    bar.append(fill);
    card.append(bar);
    card.append(el('p', 'stage-progress', `${done} of ${stage.items.length} in this stage earned`));
    container.append(card);
  }
}

export function renderMissables(container, trophies, settings, onSelect) {
  container.replaceChildren();
  const list = missableTrophies(trophies);
  if (list.length === 0) {
    container.append(el('div', 'empty', 'No missable trophies in the official list.'));
    return;
  }
  container.append(el('p', 'stage-note',
    'These can be lost for good on a single save. Each card says why, and the window in which it must be taken. Flags are read off the official descriptions: a trophy tied to one story moment, one choice, or one partner window cannot be replayed after it passes.'));
  for (const t of list) {
    const card = el('article', 'missable-card');
    const heading = el('h3');
    const link = el('a', null, displayName(t, settings));
    link.href = '#';
    link.addEventListener('click', (event) => { event.preventDefault(); onSelect(t.id); });
    heading.append(link);
    heading.append(el('span', null, ` · ${GRADE_LABEL[t.grade]}${isEarned(t.id) ? ' · earned' : ''}`));
    card.append(heading);
    card.append(el('p', 'why', t.missableWhy ?? 'Tied to a one-time story window.'));
    card.append(el('p', 'window', `Window: ${t.missableWindow ?? 'before the story moves past it'}`));
    container.append(card);
  }
}

function factRow(list, term, value) {
  if (value == null || value === '') return;
  list.append(el('dt', null, term));
  list.append(el('dd', null, String(value)));
}

export function renderDetail(container, trophy, settings, onToggle) {
  container.replaceChildren();
  if (!trophy) {
    container.append(el('p', 'placeholder',
      'Pick a trophy from the ledger and its full guide opens here: what to do, what to watch for, how long it takes, and where each fact comes from.'));
    return;
  }
  const hidden = shielded(trophy, settings);
  container.append(trophyChips(trophy, settings));
  container.append(el('h2', null, displayName(trophy, settings)));
  container.append(el('p', 'official', hidden
    ? 'Official description hidden by the spoiler shield until this trophy is earned.'
    : `“${trophy.description}” — official description`));

  const facts = el('dl', 'facts');
  factRow(facts, 'Grade', GRADE_LABEL[trophy.grade]);
  factRow(facts, 'Kind', KIND_LABEL[trophy.kind] ?? trophy.kind);
  factRow(facts, 'Roadmap stage', trophy.stageTitle);
  factRow(facts, 'Chapter', trophy.chapter);
  factRow(facts, 'Time estimate', formatMinutes(trophy.estMinutes));
  factRow(facts, 'Difficulty', trophy.difficulty);
  factRow(facts, 'Missable', trophy.missable ? 'Yes — see below' : 'No');
  container.append(facts);

  container.append(el('h3', null, 'How to get it'));
  container.append(el('p', null, hidden
    ? 'The guide stays behind the spoiler shield with the description. Earn the trophy, or switch the shield off in the toolbar, to read it.'
    : trophy.guide));

  if (!hidden && trophy.tips) {
    container.append(el('h3', null, 'Ledger notes'));
    container.append(el('p', null, trophy.tips));
  }

  if (trophy.missable) {
    container.append(el('h3', null, 'Why it can be missed'));
    container.append(el('p', null, trophy.missableWhy ?? 'Tied to a one-time story window.'));
    container.append(el('p', null, `Window: ${trophy.missableWindow ?? 'before the story moves past it'}`));
  }

  container.append(el('h3', null, 'Sources'));
  const sources = el('p', 'sources');
  const names = trophy.sources ?? [];
  names.forEach((source, index) => {
    if (index > 0) sources.append(el('span', null, ' · '));
    if (source.url) {
      const link = el('a', null, source.name);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sources.append(link);
    } else {
      sources.append(el('span', null, source.name));
    }
  });
  container.append(sources);

  const button = el('button', 'earn-btn', isEarned(trophy.id) ? 'Earned — tap to undo' : 'Mark as earned');
  button.type = 'button';
  button.setAttribute('aria-pressed', String(isEarned(trophy.id)));
  button.addEventListener('click', () => onToggle(trophy.id, !isEarned(trophy.id)));
  container.append(button);
}

export function showView(name) {
  const views = { checklist: 'listView', roadmap: 'roadmapView', missables: 'missableView' };
  for (const [key, id] of Object.entries(views)) {
    document.getElementById(id).hidden = key !== name;
  }
  for (const tab of document.querySelectorAll('.tabs [data-view]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.view === name));
  }
}
