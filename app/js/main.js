// Leonida Trophy Atlas — bootstrap and wiring.
// Loads app/data/trophies.json from this same static site (no other network use), restores the
// player's progress from localStorage, and connects the toolbar, views and detail panel.
// Screenshot scenes are plain URL parameters: ?detail=<id> opens a trophy, ?view=roadmap or
// ?view=missable picks a view, ?spoiler=on turns the spoiler guard on for the visit.

import {
  loadState, saveState, setEarned, setCount, seedDemoIfScene, exportState, importState,
} from './store.js';
import { KIND_FILTERS, applyFilters } from './filters.js';
import {
  renderChecklist, renderMissables, renderDetail, renderRoadmap, renderProgress, renderNextUp,
} from './views.js';

const params = new URLSearchParams(location.search);
const state = seedDemoIfScene(loadState(), params);
if (params.get('spoiler') === 'on') state.spoilerGuard = true;

let trophies = [];
let view = params.get('view') === 'roadmap' || params.get('view') === 'missable' ? params.get('view') : 'checklist';
let kindFilter = 'all';
let searchText = '';
let selectedId = Number(params.get('detail')) || null;

const listRoot = document.getElementById('list-root');
const detailPane = document.getElementById('detail-pane');
const roadmapPane = document.getElementById('roadmap-pane');
const emptyNote = document.getElementById('empty-note');
const ioNote = document.getElementById('io-note');

function note(message) {
  ioNote.textContent = message;
}

function persist() {
  saveState(state);
}

const handlers = {
  get selectedId() { return selectedId; },
  onSelect(id, goToView) {
    selectedId = id;
    if (goToView) view = goToView;
    render();
    if (goToView) window.scrollTo({ top: 0, behavior: 'instant' });
  },
  onToggle(id, value) {
    setEarned(state, id, value);
    persist();
    render();
  },
  onCount(id, value) {
    setCount(state, id, value);
    persist();
    render();
  },
  onNote(id, value) {
    if (value.trim()) state.notes[String(id)] = value;
    else delete state.notes[String(id)];
    persist();
  },
};

function selectedTrophy() {
  return trophies.find((t) => t.id === selectedId) ?? null;
}

function render() {
  renderProgress(trophies, state);
  renderNextUp(trophies, state, handlers.onSelect);
  for (const tab of document.querySelectorAll('.view-tabs .tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
  const inRoadmap = view === 'roadmap';
  roadmapPane.hidden = !inRoadmap;
  document.querySelector('.layout').style.display = inRoadmap ? 'none' : '';
  if (inRoadmap) {
    renderRoadmap(roadmapPane, trophies, state, handlers);
    return;
  }
  const visible = applyFilters(trophies, { kind: kindFilter, search: searchText });
  if (view === 'missable') renderMissables(listRoot, visible, state, handlers);
  else renderChecklist(listRoot, visible, state, handlers);
  if (visible.length === 0) {
    emptyNote.hidden = false;
    emptyNote.textContent = kindFilter === 'online' && !searchText
      ? 'The official 55-trophy list names no online trophies — every trophy here is earned in the story world of Leonida. This filter is ready if a future list adds them.'
      : 'No trophy matches that filter and search. Clear the search or pick another kind.';
  } else {
    emptyNote.hidden = true;
  }
  renderDetail(detailPane, selectedTrophy(), state, handlers);
}

function buildChips() {
  const wrap = document.getElementById('kind-chips');
  for (const filter of KIND_FILTERS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = filter.label;
    chip.dataset.kind = filter.key;
    chip.classList.toggle('is-active', filter.key === kindFilter);
    chip.addEventListener('click', () => {
      kindFilter = filter.key;
      for (const other of wrap.children) other.classList.toggle('is-active', other === chip);
      render();
    });
    wrap.append(chip);
  }
}

function wireToolbar() {
  document.getElementById('search').addEventListener('input', (event) => {
    searchText = event.target.value.trim();
    render();
  });
  const spoiler = document.getElementById('spoiler-toggle');
  spoiler.checked = state.spoilerGuard;
  spoiler.addEventListener('change', () => {
    state.spoilerGuard = spoiler.checked;
    persist();
    render();
  });
  for (const tab of document.querySelectorAll('.view-tabs .tab')) {
    tab.addEventListener('click', () => {
      view = tab.dataset.view;
      render();
    });
  }
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leonida-trophy-atlas-progress.json';
    link.click();
    URL.revokeObjectURL(url);
    note('Progress exported to leonida-trophy-atlas-progress.json — keep it safe, import it anywhere.');
  });
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const next = importState(await file.text());
      Object.assign(state, next);
      document.getElementById('spoiler-toggle').checked = state.spoilerGuard;
      persist();
      render();
      note('Progress imported. Welcome back to Leonida.');
    } catch {
      note('That file is not an atlas progress export — nothing was changed.');
    }
    event.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    state.earned = {};
    state.counts = {};
    state.notes = {};
    persist();
    render();
    note('Progress cleared. A fresh run at the platinum starts now.');
  });
}

async function start() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    trophies = Array.isArray(data) ? data : data.trophies;
  } catch {
    listRoot.textContent = 'The trophy data could not be loaded. Serve the app folder over HTTP (node serve.ts) and reload.';
    return;
  }
  if (selectedId !== null && !selectedTrophy()) selectedId = null;
  buildChips();
  wireToolbar();
  render();
}

start();
