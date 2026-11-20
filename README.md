# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Trophy Atlas** — an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written for this atlas that cites its sources, and steps built from the official description. Progress is saved in the browser and can be exported to a file and imported back.

## What's inside

- **Checklist** — all 55 trophies grouped by kind (story, collectibles, activities, the capstones), with grade badges, official descriptions, per-trophy counters for the counted trophies (42 Shooting Range golds, 250 stunts, 100 WAiNK spots, $250,000 laundered…), personal notes, and search.
- **Roadmap to Platinum** — six stops from first mission to 100%: The Story, Strands & Strangers, Activities & Skills, Collectibles & Exploration, Crime & Cash, 100% & Platinum, each with advice and per-stop progress.
- **Missables** — 19 trophies flagged from the official descriptions (one-time story beats, choices, partner trophies, character strands), each with the reason it can be missed.
- **Spoiler guard** — hides the names and descriptions of unearned story trophies until you earn them; PlayStation hides 28 of the 55, and the atlas marks the story-linked ones.
- **Filters** — story, missable, collectibles, activities, online (the official list names no online trophies, and the filter says so honestly).
- **Export / import** — progress lives in `localStorage`; export it to a JSON file to keep or move it.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or serve `app/` with any static file server. It works with the network off: every file it loads is its own.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json` with the vendored make.fun library.

## Sources

Official names, descriptions and grades: the PlayStation 5 list as published by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/search/games?q=Grand%20Theft%20Auto%20VI). Guides cite their sources beside each trophy; a source is cited, never copied. No Rockstar Games logo or artwork is used — the look is the atlas's own.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tfznw81m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
