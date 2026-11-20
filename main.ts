// Vice Ledger hand-in (Node 22, standard library only).
//
// The guide itself is the app/ folder beside this file: static HTML, CSS and
// ES modules that run offline in a browser, with the trophy data in
// app/data/trophies.json. This program packages it for the grader: it copies
// app/ and screenshots/ into the output folder and writes dossier.json there
// with the vendored make.fun library, which the scorer rebuilds and compares
// byte for byte — so vendor/makefun-frontend.ts stays exactly as shipped.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for the grader's /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To look at the guide itself: node serve.ts, then open the printed URL.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const shotsSource = join(repoRoot, 'screenshots');
if (existsSync(shotsSource)) cpSync(shotsSource, shotsDir, { recursive: true });

// The scorer's caps, mirrored so a local run refuses what the gate would:
// dossier text at most 163840 bytes, at most 4 screenshots of 256 KiB each,
// app/ at most 993 entries and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Vice Ledger handed in to ${outputDir} (dossier.json ${Buffer.byteLength(dossier)} bytes)`);
