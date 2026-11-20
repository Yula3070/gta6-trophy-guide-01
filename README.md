# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Yula3070/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice Ledger** — an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written for this ledger, four steps that each name their source, and an honest label where advice is drawn from the official description rather than checked in game. Progress is saved in the browser and can be exported to a file and imported back.

## What's inside

- **Checklist** — all 55 trophies grouped by kind (story, collectibles, activities, crime & cash, 100%), with grade medals, official descriptions, per-trophy counters for the counted trophies (42 Shooting Range golds, 250 stunts, 100 WAiNK spots, $250,000 laundered, 500 choices…), personal notes, and search. The audit strip in the header counts the ledger's own claims and sources live from the data.
- **Roadmap to Platinum** — seven stops from first mission to 100%: The Story, Strands & Strangers, Activities & Skills, Collectibles & Exploration, Crime & Cash, Cleanup & Challenges, 100% & Platinum, each with advice and per-stop progress, plus a Next Up planner that ranks open trophies by missable risk and counter closeness.
- **Missables & Sources** — 19 trophies flagged from the official descriptions (one-time story beats, choices, partner trophies, character strands), each with the reason it can be missed, beside a source matrix showing every trophy's sources at a glance.
- **Spoiler guard** — hides the names, descriptions and guides of unearned story trophies until you earn them; PlayStation hides 28 of the 55.
- **Filters** — story, missable, collectibles, activities, crime & cash, online (the official list names no online trophies, and the filter says so honestly).
- **Export / import** — progress lives in `localStorage`; export it to a JSON file to keep or move it. Keyboard: `1`–`4` switch views, `/` searches, `S` toggles the spoiler guard, `E` exports.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8093 — or serve `app/` with any static file server. It works with the network off: every file it loads is its own.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json` with the vendored make.fun library.

## Sources

Official names, descriptions and grades: the PlayStation 5 list as published by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Guides cite their sources beside each trophy and each step; a source is cited, never copied. No Rockstar Games logo or artwork is used — the look is the ledger's own.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tfznw81m&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
