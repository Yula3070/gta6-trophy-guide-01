![make.fun competition](https://make.fun/badge/gta6-trophy-guide-01.svg) ![rank](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/rank.svg) ![reward](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/reward.svg)

# Vice Ledger — a GTA VI trophy guide and tracker

Vice Ledger is an offline guide and checklist for the 55 PlayStation 5 trophies of
Grand Theft Auto VI, built for the [make.fun](https://make.fun/) bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## About

The app is plain static files under `app/` — no build step, no network requests.
Open `app/index.html` through any static server and it works with the network off.

What it does:

- **Tracker** — every trophy with its official name, description and grade;
  tick trophies off and progress is saved in the browser (localStorage),
  with export to a JSON file and import back.
- **Progress at a glance** — overall percentage plus per-grade counts
  (platinum, gold, silver, bronze) and an estimate of the time left.
- **Filters** — by grade, by kind (story, collectibles, activities, misc),
  missables only, earned or not, plus a text search.
- **Spoiler shield** — hide the names and descriptions of story trophies
  until you earn them.
- **Roadmap** — the order to earn the trophies in, staged by story chapter
  through to the post-story cleanup and the platinum.
- **Missables** — every trophy that can be lost for good, flagged with the
  reason, so you can grab it before its window closes.
- **A guide for each trophy** — what to do, in this entry's own words, with
  the sources each fact comes from named beside it.

## Sources

Trophy names, descriptions and grades are the official PlayStation list for
Grand Theft Auto VI (55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze),
as catalogued by Exophase and PSNProfiles before this bounty opened; the two
agree on every name, description and grade. Counts quoted in the guides
(42 Shooting Range challenges, 250 stunts, 100 WAiNK locations, and so on)
come from the official descriptions and the counts PlayStation tracks.
Guide text is written for this entry; sources are cited, never copied.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8093
```

Hand the entry in (copies `app/` and `screenshots/` to the output folder and
writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `main.ts` — hands the guide in: copies `app/` and `screenshots/`, writes `dossier.json`.
- `serve.ts` — a tiny static server for local use.
- `app/index.html`, `app/style.css` — the page and its ledger look.
- `app/js/store.js` — trophy data and saved progress.
- `app/js/filters.js` — filtering and sorting.
- `app/js/views.js` — checklist, roadmap, missables and detail rendering.
- `app/js/main.js` — wires everything together.
- `app/data/trophies.json` — the 55 trophies with guides, kinds, roadmap
  stages, missable flags, time estimates and sources.
- `screenshots/` — renders of the app; the first by name is the cover.
- `shots.json` — which view each screenshot shows.
- `vendor/makefun-frontend.ts` — the kit library, unchanged.
