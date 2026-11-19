// main.js — boots the Leonida Ledger: loads app/data/trophies.json (a local file,
// the app makes no network request), wires the toolbar and tabs, and renders the
// current view. Deep links for screenshots and sharing: ?view=checklist|roadmap|missable,
// ?detail=<trophy id>, ?spoiler=on.

import { downloadProgressFile, importStateFromJson, loadState, saveState } from './store.js';
import { renderChecklist, renderDetail, renderMissable, renderNextUp, renderProgress, renderRoadmap } from './views.js';

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const state = loadState();

let currentView = 'checklist';
let selectedId = null;
const criteria = { search: '', kind: 'all', grade: 'all' };

const searchInput = document.getElementById('search');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const spoilerToggle = document.getElementById('spoilerToggle');
const hideEarnedToggle = document.getElementById('hideEarnedToggle');
const onlineNote = document.getElementById('onlineNote');

function renderAll() {
  renderProgress(trophies, state);
  renderNextUp(trophies, state, selectTrophy);
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === currentView);
  });
  onlineNote.hidden = criteria.kind !== 'online';
  if (currentView === 'roadmap') renderRoadmap(data, state, selectTrophy);
  else if (currentView === 'missable') renderMissable(trophies, state, selectTrophy);
  else renderChecklist(trophies, state, criteria, selectedId, selectTrophy, renderAll);
  renderDetail(trophies, state, selectedId, renderAll);
}

function selectTrophy(trophyId) {
  selectedId = trophyId;
  renderAll();
  document.getElementById('detailPanel').scrollIntoView({ block: 'nearest' });
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    currentView = tab.dataset.view;
    renderAll();
  });
});

searchInput.addEventListener('input', () => {
  criteria.search = searchInput.value;
  currentView = 'checklist';
  renderAll();
});
kindFilter.addEventListener('change', () => {
  criteria.kind = kindFilter.value;
  currentView = 'checklist';
  renderAll();
});
gradeFilter.addEventListener('change', () => {
  criteria.grade = gradeFilter.value;
  currentView = 'checklist';
  renderAll();
});
spoilerToggle.addEventListener('change', () => {
  state.settings.spoiler = spoilerToggle.checked;
  saveState(state);
  renderAll();
});
hideEarnedToggle.addEventListener('change', () => {
  state.settings.hideEarned = hideEarnedToggle.checked;
  saveState(state);
  renderAll();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  downloadProgressFile(state);
});
document.getElementById('importInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = importStateFromJson(await file.text());
    Object.assign(state, imported);
    saveState(state);
    spoilerToggle.checked = state.settings.spoiler;
    hideEarnedToggle.checked = state.settings.hideEarned;
    renderAll();
  } catch {
    alert('That file is not a Leonida Ledger progress export.');
  }
  event.target.value = '';
});

// Deep links (?view=, ?detail=, ?spoiler=on) — used by the maker's screenshots.
const params = new URLSearchParams(location.search);
if (params.get('view') === 'roadmap' || params.get('view') === 'missable') {
  currentView = params.get('view');
}
if (params.get('spoiler') === 'on') state.settings.spoiler = true;
const detailParam = Number(params.get('detail'));
if (Number.isInteger(detailParam) && trophies.some((t) => t.id === detailParam)) {
  selectedId = detailParam;
}

spoilerToggle.checked = state.settings.spoiler;
hideEarnedToggle.checked = state.settings.hideEarned;
renderAll();
