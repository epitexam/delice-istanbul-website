import { statSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

/** Date de modification la plus récente sous un chemin, fichier ou dossier. */
function newestMtime(path: string): number {
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  return readdirSync(path).reduce(
    (newest, entry) => Math.max(newest, newestMtime(join(path, entry))),
    stat.mtimeMs,
  );
}

/**
 * Les tests comparent le site *compilé* au design : ils ne valident rien
 * d'utile si dist/ est absent ou plus vieux que les sources. La compilation
 * appartient aux scripts npm, ce garde-fou signale les invocations directes
 * de `playwright test` qui la contourneraient.
 */
export default function globalSetup() {
  const dist = resolve(root, 'dist/index.html');

  if (!existsSync(dist)) {
    throw new Error(
      'dist/ est absent : lancez `npm run test:e2e` (ou `npm run build`) plutôt que `playwright test`.',
    );
  }

  const built = statSync(dist).mtimeMs;
  const sources = ['src', 'astro.config.mjs', 'package.json']
    .map((entry) => resolve(root, entry))
    .filter(existsSync);
  const changed = Math.max(...sources.map(newestMtime));

  if (changed > built) {
    throw new Error(
      'dist/ est plus ancien que les sources : recompilez avec `npm run test:e2e`.',
    );
  }
}
