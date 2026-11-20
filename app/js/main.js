// Vice Ledger entry point: loads the trophy data, restores saved progress,
// wires the toolbar and tabs, and keeps every view in step with the store.

import {
  allTrophies, exportProgress, importProgress, loadProgress, loadSettings,
  loadTrophies, resetProgress, saveSettings, setEarned, trophyById,
} from './store.js';
import { applyFilters, defaultFilters } from './filters.js';
import { renderChecklist, renderDetail, renderMissables, renderRoadmap, renderSummary, showView } from './views.js';

const filters = defaultFilters();
let settings = loadSettings();
let selectedId = null;
let activeView = 'checklist';

const listView = document.getElementById('listView');
const roadmapView = document.getElementById('roadmapView');
const missableView = document.getElementById('missableView');
const detailPanel = document.getElementById('detail');

function refresh() {
  renderSummary();
  const visible = applyFilters(allTrophies(), filters);
  renderChecklist(listView, visible, settings, selectedId, {
    grouped: filters.sort === 'roadmap',
    onToggle: toggleEarned,
    onSelect: selectTrophy,
  });
  renderRoadmap(roadmapView, allTrophies(), settings, selectTrophy);
  renderMissables(missableView, allTrophies(), settings, selectTrophy);
  renderDetail(detailPanel, trophyById(selectedId), settings, toggleEarned);
}

function toggleEarned(id, earned) {
  setEarned(id, earned);
  refresh();
}

function selectTrophy(id) {
  selectedId = id;
  refresh();
  if (window.innerWidth <= 980) detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wireToolbar() {
  const search = document.getElementById('search');
  search.addEventListener('input', () => { filters.query = search.value; refresh(); });

  const bind = (id, key) => {
    const node = document.getElementById(id);
    node.addEventListener('change', () => { filters[key] = node.value; refresh(); });
  };
  bind('gradeFilter', 'grade');
  bind('kindFilter', 'kind');
  bind('earnedFilter', 'status');
  bind('sortBy', 'sort');

  const missableOnly = document.getElementById('missableOnly');
  missableOnly.addEventListener('change', () => { filters.missableOnly = missableOnly.checked; refresh(); });

  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = settings.spoilerShield;
  spoiler.addEventListener('change', () => {
    settings = saveSettings({ spoilerShield: spoiler.checked });
    refresh();
  });
}

function wireTabs() {
  for (const tab of document.querySelectorAll('.tabs [data-view]')) {
    tab.addEventListener('click', () => {
      activeView = tab.dataset.view;
      showView(activeView);
    });
  }
}

function wireProgressActions() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportProgress(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vice-ledger-progress.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      importProgress(JSON.parse(await file.text()));
      refresh();
    } catch (error) {
      detailPanel.replaceChildren();
      const note = document.createElement('p');
      note.className = 'placeholder';
      note.textContent = `Import failed: ${error.message}. Pick a file exported from Vice Ledger.`;
      detailPanel.append(note);
    } finally {
      event.target.value = '';
    }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear every tick in the ledger? Export first if you want a copy.')) return;
    resetProgress();
    refresh();
  });
}

async function boot() {
  loadProgress();
  wireToolbar();
  wireTabs();
  wireProgressActions();
  try {
    await loadTrophies();
  } catch (error) {
    listView.replaceChildren();
    const note = document.createElement('div');
    note.className = 'empty';
    note.textContent = `The trophy data could not be loaded (${error.message}). Serve the app/ folder with a static server (node serve.ts) and reload.`;
    listView.append(note);
    return;
  }
  showView(activeView);
  refresh();
}

boot();
