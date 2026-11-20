// Leonida Cover Studio — entry program (Node 22, standard library only).
// Hands the app in: copies this directory's app/ and screenshots/ into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library, which is what the judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsOut = join(outputDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
}

// The scorer's caps, as the kit's gate states them: the dossier text is
// capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, app/
// at most 993 files and 48 MiB in all, no app/ path over 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
