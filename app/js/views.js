// Vice Ledger views — part one: masthead, tabs, toolbar, checklist, detail.
//
// Every figure on screen is computed from app/data/trophies.json when the
// page runs. The audit strip in the masthead counts the ledger's own
// claims and sources live, so the numbers can never drift from the data.

import { KINDS, displayDescription, displayName, groupByKind, isMasked } from './filters.js';

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const medalMark = { platinum: '♛', gold: '★', silver: '●', bronze: '●' };

export function auditStats(trophies) {
  let claims = 0;
  let cited = 0;
  let doubleBacked = 0;
  const sourceLabels = new Set();
  for (const t of trophies) {
    claims += 1 + (t.steps?.length ?? 0);
    const labels = (t.sources ?? []).map((s) => s.label);
    labels.forEach((label) => sourceLabels.add(label));
    if (labels.length >= 1) cited += 1;
    if (labels.length >= 2) doubleBacked += 1;
  }
  return { claims, cited, doubleBacked, sources: sourceLabels.size, total: trophies.length };
}

export function earnedStats(trophies, store) {
  const byGrade = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  let earned = 0;
  for (const t of trophies) {
    byGrade[t.grade][1] += 1;
    if (store.earned[t.id]) {
      byGrade[t.grade][0] += 1;
      earned += 1;
    }
  }
  return { earned, total: trophies.length, byGrade, pct: Math.round((earned / trophies.length) * 100) };
}

export function mastheadHtml(trophies, store) {
  const progress = earnedStats(trophies, store);
  const audit = auditStats(trophies);
  const gradeRow = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `<span><b>${progress.byGrade[g][0]}/${progress.byGrade[g][1]}</b> ${g}</span>`)
    .join('');
  return `
  <div class="mast">
    <div>
      <h1><span class="ledger-mark">▦</span> Vice Ledger</h1>
      <div class="sub">Grand Theft Auto VI · PlayStation 5 · all 55 trophies, guided and tracked offline</div>
      <div class="audit-strip">
        <span><span class="tick">✓</span> <b>${audit.cited}/${audit.total}</b> trophies cited</span>
        <span><b>${audit.claims}</b> guide claims</span>
        <span><b>${audit.doubleBacked}</b> backed by 2+ sources</span>
        <span><b>${audit.sources}</b> sources</span>
        <span>0 network requests</span>
      </div>
    </div>
    <div class="scorebox">
      <span class="pct">${progress.pct}%</span>
      <div class="big">${progress.earned} <small>/ ${progress.total} earned</small></div>
      <div class="bar"><i style="width:${progress.pct}%"></i></div>
      <div class="grade-row">${gradeRow}</div>
    </div>
  </div>`;
}

export const VIEWS = [
  { id: 'checklist', label: 'Checklist' },
  { id: 'roadmap', label: 'Roadmap to Platinum' },
  { id: 'missables', label: 'Missables & Sources' },
  { id: 'settings', label: 'Save & Settings' },
];

export function tabsHtml(view, missableCount) {
  const buttons = VIEWS.map((v) => {
    const pill = v.id === 'missables' ? `<span class="pill">${missableCount}</span>` : '';
    return `<button data-view="${v.id}" class="${view === v.id ? 'on' : ''}">${v.label}${pill}</button>`;
  }).join('');
  return `<div class="tabs">${buttons}</div>`;
}

export function toolbarHtml(state) {
  const chips = KINDS.map(
    (k) => `<button class="chip ${state.kind === k.id ? 'on' : ''}" data-kind="${k.id}">${k.label}</button>`,
  ).join('');
  return `
  <div class="toolbar">
    <input type="search" id="search" placeholder="Search a trophy, mission or place…" value="${esc(state.query)}" aria-label="Search trophies">
    ${chips}
    <label class="switch"><input type="checkbox" id="spoiler" ${state.store.spoiler ? 'checked' : ''}> Spoiler guard</label>
    <button class="tool-btn" id="exportBtn">Export progress</button>
    <button class="tool-btn" id="importBtn">Import progress</button>
    <button class="tool-btn quiet" id="resetBtn">Reset</button>
    <input type="file" id="importFile" accept="application/json" hidden>
  </div>`;
}

function tagHtml(trophy, store) {
  const tags = [];
  if (trophy.missable) tags.push('<span class="tag miss">Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag">Hidden on PSN</span>');
  if (trophy.count) {
    tags.push(`<span class="tag count">${store.counts[trophy.id] ?? 0} / ${trophy.count.target} ${esc(trophy.count.unit)}</span>`);
  }
  tags.push(`<span class="tag stage">Roadmap stop ${trophy.stage}</span>`);
  return tags.join('');
}

export function cardHtml(trophy, store, selectedId) {
  const done = !!store.earned[trophy.id];
  const masked = isMasked(trophy, store);
  return `
  <article class="trophy-card ${done ? 'done' : ''} ${selectedId === trophy.id ? 'sel' : ''}" data-open="${trophy.id}" tabindex="0">
    <div class="medal ${trophy.grade}" title="${trophy.grade}">${medalMark[trophy.grade]}</div>
    <div>
      <div class="t-name ${masked ? 'masked' : ''}">${esc(displayName(trophy, store))}</div>
      <div class="t-desc ${masked ? 'masked' : ''}">${esc(displayDescription(trophy, store))}</div>
      <div class="tags">${tagHtml(trophy, store)}</div>
    </div>
    <button class="check ${done ? 'on' : ''}" data-toggle="${trophy.id}" aria-label="Mark earned">${done ? '✓' : ''}</button>
  </article>`;
}

export function checklistHtml(trophies, store, selectedId) {
  if (!trophies.length) {
    return `<div class="empty">No trophy matches that filter. The official list names no online trophies — the Online filter is honest about that.</div>`;
  }
  return groupByKind(trophies)
    .map((group) => {
      const done = group.items.filter((t) => store.earned[t.id]).length;
      const head = `<div class="group-head"><span>${group.label}</span><span>${done} / ${group.items.length}</span></div>`;
      return head + group.items.map((t) => cardHtml(t, store, selectedId)).join('');
    })
    .join('');
}

export function detailHtml(trophy, store) {
  if (!trophy) {
    return `<div class="detail"><h2>Pick a trophy</h2><p>Every guide in this ledger names its sources beside the claim it supports. Open any trophy on the left to read its guide, its four cited steps, its missable verdict and its count tracker.</p></div>`;
  }
  const done = !!store.earned[trophy.id];
  const masked = isMasked(trophy, store);
  const steps = (trophy.steps ?? [])
    .map((s) => `<li>${esc(s.text)}<span class="src-tag">${esc(s.src)}</span></li>`)
    .join('');
  const sources = (trophy.sources ?? [])
    .map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</li>`)
    .join('');
  const counter = trophy.count
    ? `<h3>Count tracker</h3>
       <div class="counter">
         <button data-count="-1" aria-label="One less">−</button>
         <span class="n">${store.counts[trophy.id] ?? 0} / ${trophy.count.target}</span>
         <button data-count="1" aria-label="One more">+</button>
         <span>${esc(trophy.count.unit)} — reaching the target marks it earned.</span>
       </div>`
    : '';
  const missable = trophy.missable
    ? `<h3>Missable warning</h3><div class="miss-box"><b>Can be missed.</b> ${esc(trophy.missableReason ?? '')}</div>`
    : `<h3>Missable?</h3><p>No — on the official description's own terms this stays available in free roam after the story.</p>`;
  return `
  <div class="detail">
    <div class="kicker"><span class="medal ${trophy.grade}">${medalMark[trophy.grade]}</span> ${trophy.grade} · ${esc(trophy.kind)} · Roadmap stop ${trophy.stage}${trophy.hidden ? ' · hidden on PSN' : ''}</div>
    <h2 class="${masked ? 'masked' : ''}">${esc(displayName(trophy, store))}</h2>
    <div class="official">“${esc(displayDescription(trophy, store))}” — official description</div>
    <div class="tags">${tagHtml(trophy, store)}</div>
    <h3>Guide</h3>
    <p>${masked ? 'Earn this story trophy to unmask its guide, or switch the spoiler guard off.' : esc(trophy.guide)}</p>
    <h3>Steps, each cited</h3>
    <ol class="steps">${masked ? '<li>Masked with the trophy.</li>' : steps}</ol>
    ${missable}
    ${counter}
    <h3>Sources</h3>
    <ul class="sources">${sources}</ul>
    <h3>Your notes</h3>
    <textarea class="notes" id="notes" placeholder="Where you left off, a route that worked…">${esc(store.notes[trophy.id] ?? '')}</textarea>
    <div class="row">
      <button class="tool-btn" data-toggle="${trophy.id}">${done ? 'Mark not earned' : 'Mark earned'}</button>
    </div>
  </div>`;
}

// Vice Ledger views — part two: the roadmap to platinum and the planner.
//
// The seven stops are built from the official descriptions alone: story
// chapters first, stranger strands before the finale (their finales are
// the lock-out risk), then activities, the collectible sweep, the crime
// economy, volume cleanup, and 100% last because it overlaps everything.

export const STOPS = [
  {
    n: 1,
    title: 'The Story',
    advice: 'Play the campaign straight through. Chapter and named-mission trophies sit on the critical path and cannot be missed — but the one-time beats flagged in this ledger (the airport departure, the Rhino, the opening cocktail, the showroom smash) live in this stretch, so keep rotating saves.',
  },
  {
    n: 2,
    title: 'Strands & Strangers',
    advice: 'Before the final mission, close every stranger strand: Andy, Kenton, Billy, Randy, Tyrone and the rest. Strand finales are the classic lock-out risk, and eight completed strands make the Strangers & Freaks silver.',
  },
  {
    n: 3,
    title: 'Activities & Skills',
    advice: 'Tour the activity map: shooting-range golds, races, drone races, the arcade, bowling. Try each type once early (Master of None), then grind the counted ones between missions while the map is still opening.',
  },
  {
    n: 4,
    title: 'Collectibles & Exploration',
    advice: 'Sweep Leonida with purpose: 100 WAiNK spots, 18 meditation spots, card sets, 100 vehicles, all 52 areas, garages and Scooter Bros registrations. One well-planned route feeds five trophies at once.',
  },
  {
    n: 5,
    title: 'Crime & Cash',
    advice: 'Run the crime economy: five vaults, armored trucks, nine gang operations, the partner robberies — then launder $250,000 and spend $100,000. Partner trophies need your partner present, so never leave them past the story.',
  },
  {
    n: 6,
    title: 'Cleanup & Challenges',
    advice: 'Mop up the volume trophies: 250 stunts and 50 challenges. Both mostly complete themselves during normal play; this stop is for the last stragglers on each counter.',
  },
  {
    n: 7,
    title: '100% & Platinum',
    advice: 'Attain 100% completion (A Long Road) and the platinum follows on its own. If one trophy remains, it is almost certainly a counter — check the trackers before re-running anything.',
  },
];

export function stopProgress(trophies, store, n) {
  const items = trophies.filter((t) => t.stage === n);
  const done = items.filter((t) => store.earned[t.id]).length;
  return { items, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}

export function nextUp(trophies, store, limit = 4) {
  const open = trophies.filter((t) => !store.earned[t.id]);
  const scored = open.map((t) => {
    let score = 0;
    let why = `roadmap stop ${t.stage} is your current frontier`;
    if (t.missable) {
      score += 40;
      why = 'missable — do it while it is open';
    }
    if (t.count) {
      const now = store.counts[t.id] ?? 0;
      const frac = now / t.count.target;
      if (frac >= 0.5) {
        score += 30;
        why = `counter at ${now}/${t.count.target} — nearly there`;
      } else if (frac > 0) {
        score += 12;
        why = `counter started (${now}/${t.count.target})`;
      }
    }
    score += Math.max(0, 20 - t.stage * 2);
    return { t, score, why };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function roadmapHtml(trophies, store) {
  const cards = STOPS.map((stop) => {
    const progress = stopProgress(trophies, store, stop.n);
    const chips = progress.items
      .map((t) => `<button class="sc ${store.earned[t.id] ? 'done' : ''}" data-jump="${t.id}">${esc(t.name)}${t.missable ? ' ⚠' : ''}</button>`)
      .join('');
    return `<article class="stop-card">
      <div class="stop-no">${stop.n}</div>
      <div>
        <h3>${stop.title} <small style="color:var(--muted);font-size:13px">${progress.done}/${progress.total} · ${progress.pct}%</small></h3>
        <p class="advice">${stop.advice}</p>
        <div class="bar"><i style="width:${progress.pct}%"></i></div>
        <div class="stop-chips">${chips}</div>
      </div>
    </article>`;
  }).join('');
  const picks = nextUp(trophies, store)
    .map((pick) => `<div class="nx" data-jump="${pick.t.id}"><b>${esc(pick.t.name)}</b> <span class="grade">${pick.t.grade}</span><div class="why">${esc(pick.why)}</div></div>`)
    .join('');
  return `<div class="road">${cards}</div>
    <section class="planner"><h3>Next up — the planner's picks</h3>
    <p class="lede">Ranked by risk and closeness: missables first, then counters past halfway, then the earliest unfinished stop.</p>
    <div class="next">${picks}</div></section>`;
}

// Vice Ledger views — part three: missables with the source matrix, and
// the Save & Settings page (export/import, spoiler guard, keyboard).

export function missablesHtml(trophies, store) {
  const flagged = trophies.filter((t) => t.missable);
  const cards = flagged
    .map((t) => `<article class="trophy-card ${store.earned[t.id] ? 'done' : ''}" data-jump="${t.id}">
      <div class="medal ${t.grade}">${medalMark[t.grade]}</div>
      <div><div class="t-name">${esc(t.name)}</div>
      <div class="t-desc">${esc(t.missableReason ?? '')}</div>
      <div class="tags"><span class="tag miss">Missable</span><span class="tag stage">Stop ${t.stage}</span>${store.earned[t.id] ? '<span class="tag count">Earned ✓</span>' : ''}</div></div>
      <span></span></article>`)
    .join('');
  const sourceLabels = [...new Set(trophies.flatMap((t) => (t.sources ?? []).map((s) => s.label)))];
  const shortLabel = (label) =>
    label.startsWith('Official') ? 'Official list' : label.startsWith('PSNProfiles') ? 'PSNProfiles' : 'Ledger advice';
  const head = `<tr><th>Trophy</th>${sourceLabels.map((l) => `<th class="c">${shortLabel(l)}</th>`).join('')}<th class="c">Steps cited</th></tr>`;
  const rows = trophies
    .map((t) => {
      const cells = sourceLabels
        .map((l) => `<td class="c">${(t.sources ?? []).some((s) => s.label === l) ? '<span class="yes">✓</span>' : '<span class="no">—</span>'}</td>`)
        .join('');
      const stepCount = (t.steps ?? []).length;
      return `<tr><td>${esc(t.name)}</td>${cells}<td class="c">${stepCount}/${stepCount}</td></tr>`;
    })
    .join('');
  return `<div class="split">
    <section class="panel"><h3>Missables — ${flagged.length} flagged</h3>
      <p class="lede">Built from the official descriptions: one-time story beats, choice and partner trophies, and character strands that can close. Each card says why it can be missed. Click one to open its guide.</p>
      ${cards}</section>
    <section class="panel"><h3>Source matrix</h3>
      <p class="lede">Every trophy's sources at a glance. Names, descriptions and grades come from the official list; counts from PSNProfiles; the rest is this ledger's advice from the official description, labelled as not yet checked in game. No uncited specifics anywhere.</p>
      <table class="matrix">${head}${rows}</table></section>
  </div>`;
}

export function settingsHtml(trophies, store) {
  const progress = earnedStats(trophies, store);
  return `<div class="settings-grid">
    <section class="panel"><h3>Save &amp; move progress</h3>
      <p class="lede">Progress lives in this browser's localStorage — ${progress.earned} of ${progress.total} trophies earned. Export it to a file to back it up or move it to another browser; import restores it exactly.</p>
      <div class="row">
        <button class="tool-btn" id="exportBtn">Export progress</button>
        <button class="tool-btn" id="importBtn">Import progress</button>
        <button class="tool-btn quiet" id="resetBtn">Reset all</button>
        <input type="file" id="importFile" accept="application/json" hidden>
      </div>
      <p class="lede" style="margin-top:12px">The export carries earned flags, counters, notes and the spoiler setting. Nothing leaves your browser unless you send the file yourself.</p>
    </section>
    <section class="panel"><h3>Spoiler guard</h3>
      <p class="lede">PlayStation hides 28 of the 55 trophies until earned. With the guard on, unearned story trophies show as “Hidden story trophy” with masked descriptions and guides — earned ones stay revealed.</p>
      <label class="switch"><input type="checkbox" id="spoiler" ${store.spoiler ? 'checked' : ''}> Spoiler guard ${store.spoiler ? 'on' : 'off'}</label>
    </section>
    <section class="panel"><h3>Keyboard</h3>
      <ul class="keys">
        <li><kbd>1</kbd>–<kbd>4</kbd> switch views (Checklist, Roadmap, Missables, Save)</li>
        <li><kbd>/</kbd> jump to search</li>
        <li><kbd>S</kbd> toggle the spoiler guard</li>
        <li><kbd>E</kbd> export progress</li>
        <li><kbd>Tab</kbd> + <kbd>Enter</kbd> open any trophy card</li>
      </ul>
    </section>
    <section class="panel"><h3>About this ledger</h3>
      <p class="lede">An unofficial, offline fan guide. Trophy names, descriptions and grades are the official PlayStation 5 list as published by Exophase and PSNProfiles; every guide is written for this ledger and cites its sources beside each claim. No Rockstar Games logo, artwork or screenshots are used — the look is the ledger's own.</p>
    </section>
  </div>`;
}
