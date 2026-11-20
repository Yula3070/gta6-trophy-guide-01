// Vice Ledger boot: load the trophy data, render the four views, wire input.
//
// Progress lives in localStorage (see store.js). The ?seed=demo parameter
// exists so screenshots can show a tracker mid-journey; it writes the same
// localStorage a real reader's progress would, nothing more.

import { loadStore, saveStore, toggleEarned, setCount, setNote, exportProgress, importProgress, resetProgress } from './store.js';
import { filterTrophies } from './filters.js';
import { mastheadHtml, tabsHtml, toolbarHtml, checklistHtml, detailHtml, roadmapHtml, missablesHtml, settingsHtml } from './views.js';

const params = new URLSearchParams(location.search);
const state = {
  trophies: [],
  store: loadStore(),
  view: params.get('view') ?? 'checklist',
  kind: 'all',
  query: '',
  selectedId: params.get('detail') ? Number(params.get('detail')) : 17,
};

if (params.get('spoiler') === 'on') state.store.spoiler = true;

function seedDemoProgress() {
  const earnedIds = [2, 3, 4, 8, 9, 10, 15, 16, 19, 21, 35, 36, 39, 41, 44, 45, 51, 55];
  for (const id of earnedIds) state.store.earned[id] = true;
  state.store.counts = { 15: 250, 17: 23, 19: 20, 25: 5, 31: 37, 35: 100, 52: 84000, 53: 41200 };
  delete state.store.earned[17];
  state.store.notes[17] = 'Gold on the pistol lanes; rifle lanes still silver — replay those first.';
  saveStore(state.store);
}
if (params.get('seed') === 'demo' && !state.store.earned[2]) seedDemoProgress();

const $masthead = document.getElementById('masthead');
const $tabs = document.getElementById('tabs');
const $view = document.getElementById('view');
const $colophon = document.getElementById('colophon');

function selectedTrophy() {
  return state.trophies.find((t) => t.id === state.selectedId) ?? null;
}

function render() {
  $masthead.innerHTML = mastheadHtml(state.trophies, state.store);
  $tabs.innerHTML = tabsHtml(state.view, state.trophies.filter((t) => t.missable).length);
  $colophon.innerHTML = `<span>Vice Ledger — an unofficial fan guide. Trophy names, descriptions and grades: the official PS5 list (Exophase / PSNProfiles). Guides are this ledger's own words and cite their sources; no Rockstar logo or artwork.</span><span>Works offline · progress in localStorage</span>`;

  if (state.view === 'checklist') {
    const shown = filterTrophies(state.trophies, state);
    $view.innerHTML =
      toolbarHtml(state) +
      `<div class="panes"><section>${checklistHtml(shown, state.store, state.selectedId)}</section><aside>${detailHtml(selectedTrophy(), state.store)}</aside></div>`;
  } else if (state.view === 'roadmap') {
    $view.innerHTML = roadmapHtml(state.trophies, state.store);
  } else if (state.view === 'missables') {
    $view.innerHTML = missablesHtml(state.trophies, state.store);
  } else if (state.view === 'settings') {
    $view.innerHTML = settingsHtml(state.trophies, state.store);
  }
  wireEvents();
}

function wireEvents() {
  $tabs.querySelectorAll('[data-view]').forEach((button) =>
    button.addEventListener('click', () => { state.view = button.dataset.view; render(); }),
  );
  const search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', () => {
      state.query = search.value;
      render();
      const again = document.getElementById('search');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }
  $view.querySelectorAll('[data-kind]').forEach((button) =>
    button.addEventListener('click', () => { state.kind = button.dataset.kind; render(); }),
  );
  const spoiler = document.getElementById('spoiler');
  if (spoiler) {
    spoiler.addEventListener('change', () => {
      state.store.spoiler = spoiler.checked;
      saveStore(state.store);
      render();
    });
  }
  $view.querySelectorAll('[data-open]').forEach((card) =>
    card.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-toggle]')) return;
      state.selectedId = Number(card.dataset.open);
      render();
    }),
  );
  $view.querySelectorAll('[data-toggle]').forEach((button) =>
    button.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleEarned(state.store, Number(button.dataset.toggle));
      render();
    }),
  );
  $view.querySelectorAll('[data-count]').forEach((button) =>
    button.addEventListener('click', () => {
      const trophy = selectedTrophy();
      if (!trophy?.count) return;
      setCount(state.store, trophy.id, (state.store.counts[trophy.id] ?? 0) + Number(button.dataset.count), trophy.count.target);
      render();
    }),
  );
  const notes = document.getElementById('notes');
  if (notes) notes.addEventListener('input', () => setNote(state.store, state.selectedId, notes.value));
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportProgress(state.store));
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      if (!importFile.files[0]) return;
      importProgress(importFile.files[0], (store) => { if (store) { state.store = store; render(); } });
    });
  }
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => { state.store = resetProgress(); render(); });
  $view.querySelectorAll('[data-jump]').forEach((el) =>
    el.addEventListener('click', () => {
      state.selectedId = Number(el.dataset.jump);
      state.view = 'checklist';
      render();
    }),
  );
}

document.addEventListener('keydown', (ev) => {
  if (ev.target.matches('input, textarea')) return;
  const views = ['checklist', 'roadmap', 'missables', 'settings'];
  if (ev.key >= '1' && ev.key <= '4') { state.view = views[Number(ev.key) - 1]; render(); }
  if (ev.key === '/') { ev.preventDefault(); document.getElementById('search')?.focus(); }
  if (ev.key.toLowerCase() === 's') { state.store.spoiler = !state.store.spoiler; saveStore(state.store); render(); }
  if (ev.key.toLowerCase() === 'e') exportProgress(state.store);
});

async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  state.trophies = data.trophies ?? data;
  render();
}
boot();
