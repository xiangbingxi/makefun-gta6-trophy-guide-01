// Leonida Trophy Atlas — hands the entry in (Node 22, standard library only).
// The guide itself is static files under app/ (index.html, style.css, app.js,
// data/*.json), plus 3–4 screenshots under screenshots/. This program copies
// both folders into the output directory and writes dossier.json there — the
// summary the judge reads — using the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's own copy, left byte-for-byte: the
// scorer rebuilds the dossier from its own copy and compares the two.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const dest = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(dest, { recursive: true });
cpSync(join(here, 'app'), join(dest, 'app'), { recursive: true });
mkdirSync(join(dest, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(dest, 'screenshots'), { recursive: true });
}

// Caps from the scorer's own reference/gate.json. Only text_max_bytes shapes
// the dossier bytes; the rest refuse an entry the scorer would refuse anyway:
// more than 4 screenshots, or one over 256 KiB; more than 993 files and
// directories in app/, or 48 MiB of app files. app/ counts beside /output's
// own 1000-entry cap, its screenshots/ and dossier.json.
writeFileSync(
  join(dest, 'dossier.json'),
  buildDossier(dest, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
