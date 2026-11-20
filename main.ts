// Vice Ledger entry program for gta6-trophy-guide-01 (Node 22, standard library only).
// The guide is the app/ folder next to this file: static files that open at
// app/index.html in a desktop browser and run fully offline. This program is
// only the courier — it copies app/ and screenshots/ into the output folder
// (/output in the grader, MAKEFUN_OUTPUT_DIR anywhere else) and writes
// dossier.json with the kit's vendored library, untouched.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly before copying anything if the guide is incomplete: a dossier
// built from a missing app/ or an empty screenshots/ would only waste a
// grading run, so check the two inputs the gate cares about up front.
for (const required of ['app/index.html', 'app/data/trophies.json', 'screenshots']) {
  if (!existsSync(join(repoDir, required))) {
    throw new Error(`Vice Ledger: missing ${required} — build the guide before handing it in`);
  }
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate: dossier text 160 KiB, at most 4
// screenshots of 256 KiB, app/ at most 993 entries and 48 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Report the dossier size against the gate's 1.5 MiB cap so a local run
// shows the same headroom the scorer will see.
const dossierBytes = Buffer.byteLength(dossier, 'utf8');
console.log(`Vice Ledger handed in to ${outDir} (dossier.json ${dossierBytes} bytes of 1572864 max)`);
