// Leonida Trophy Atlas — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the static app in ./app (plain HTML/CSS/ES modules, no build step, works offline).
// This program hands it in: it copies app/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored make.fun library (vendor/makefun-frontend.ts, unchanged).
//
// Locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate refuses an entry whose screenshots/ holds fewer than 3 images, so fail here with a
// clear message instead of handing in a dossier the scorer would reject anyway.
const shotsDir = join(repoRoot, 'screenshots');
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name))
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 PNG/JPEG files, found ${shotFiles.length}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A one-line receipt for whoever runs this by hand. Console only — nothing here reaches /output,
// so the two grader runs still write byte-identical trees.
const dossierBytes = Buffer.byteLength(dossier, 'utf8');
console.log(
  `handed in: app/ + ${shotFiles.length} screenshots copied, dossier.json ${dossierBytes} bytes -> ${outputDir}`,
);
