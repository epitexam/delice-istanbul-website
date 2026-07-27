import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Parcours utilisateur :
 *   « En tant que mainteneur, je veux que le site compilé ne contienne ni
 *     variable CSS fantôme ni règle morte, afin que le design reste fidèle
 *     après refactorisation. »
 *
 * Ces tests lisent l'artefact de build (dist/) : ils vérifient le résultat
 * réel servi aux visiteurs, pas les intentions du code source.
 */

const root = resolve(import.meta.dirname, '../..');
const distDir = resolve(root, 'dist');
const referencePath = resolve(root, 'tests/fixtures/reference-design.html');

let html = '';
let css = '';
let reference = '';

beforeAll(() => {
  html = readFileSync(resolve(distDir, 'index.html'), 'utf8');
  const assets = resolve(distDir, '_astro');
  css = readdirSync(assets)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(resolve(assets, file), 'utf8'))
    .join('\n');
  reference = readFileSync(referencePath, 'utf8');
});

/** Toutes les paires (classe, portée Astro) réellement présentes dans le HTML. */
function renderedScopePairs(source: string): Set<string> {
  const pairs = new Set<string>();
  for (const tag of source.match(/<[a-zA-Z][^>]*>/g) ?? []) {
    const classes = /class="([^"]*)"/.exec(tag)?.[1].split(/\s+/).filter(Boolean) ?? [];
    const cids = (tag.match(/data-astro-cid-[a-z0-9]+/g) ?? []) as string[];
    for (const cls of classes) for (const cid of cids) pairs.add(`${cls}|${cid}`);
  }
  return pairs;
}

describe('variables CSS', () => {
  it('ne référence aucune variable non définie', () => {
    const used = new Set(
      (css.match(/var\(\s*(--[a-zA-Z0-9-]+)/g) ?? []).map((match) =>
        match.replace(/var\(\s*/, ''),
      ),
    );
    const defined = new Set(
      (css.match(/(--[a-zA-Z0-9-]+)\s*:/g) ?? []).map((match) => match.replace(/\s*:$/, '')),
    );

    const missing = [...used].filter((name) => !defined.has(name)).sort();
    expect(missing).toEqual([]);
  });
});

describe('styles à portée de composant (scoped)', () => {
  it('ne déclare pas de style scopé dans le mauvais composant', () => {
    const rendered = renderedScopePairs(html);
    const renderedClasses = new Set([...rendered].map((pair) => pair.split('|')[0]));

    // Sélecteurs simples du type `.classe[data-astro-cid-xxxx]`.
    // Une classe posée sur la page mais toujours accompagnée d'une AUTRE portée
    // signale un style écrit dans un composant parent : il ne s'appliquera jamais.
    const scoped = css.match(/\.[a-zA-Z0-9_-]+\[data-astro-cid-[a-z0-9]+\]/g) ?? [];
    const misplaced = [
      ...new Set(
        scoped.filter((selector) => {
          const [, cls, cid] =
            /^\.([a-zA-Z0-9_-]+)\[(data-astro-cid-[a-z0-9]+)\]$/.exec(selector) ?? [];
          return cls && cid && renderedClasses.has(cls) && !rendered.has(`${cls}|${cid}`);
        }),
      ),
    ].sort();

    expect(misplaced).toEqual([]);
  });
});

describe('propreté du HTML généré', () => {
  it("n'émet pas d'attribut style vide", () => {
    const empties = html.match(/<[a-zA-Z][^>]*\sstyle(?=[\s>])[^>]*>/g) ?? [];
    expect(empties).toEqual([]);
  });

  it('conserve les identifiants de section utilisés par la navigation', () => {
    for (const id of ['top', 'maison', 'cuisine', 'infos', 'adresse']) {
      expect(html).toContain(`id="${id}"`);
    }
  });
});

describe('parité SEO avec le design de référence', () => {
  const jsonLd = (source: string) =>
    JSON.parse(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(source)![1],
    );

  it('publie les mêmes données structurées Restaurant', () => {
    expect(jsonLd(html)).toEqual(jsonLd(reference));
  });

  it('reprend les métadonnées du design', () => {
    const meta = (source: string, attribute: string, value: string) =>
      new RegExp(`<meta[^>]*${attribute}="${value}"[^>]*content="([^"]*)"`).exec(source)?.[1] ??
      new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attribute}="${value}"`).exec(source)?.[1];

    expect(meta(html, 'name', 'theme-color')).toBe(meta(reference, 'name', 'theme-color'));
    expect(meta(html, 'name', 'robots')).toBe(meta(reference, 'name', 'robots'));
    expect(meta(html, 'property', 'og:type')).toBe(meta(reference, 'property', 'og:type'));
    expect(meta(html, 'property', 'og:locale')).toBe(meta(reference, 'property', 'og:locale'));
  });

  it('charge les mêmes familles de polices', () => {
    const fonts = (source: string) =>
      /fonts\.googleapis\.com\/css2\?([^"]*)"/.exec(source)![1];
    expect(fonts(html)).toBe(fonts(reference));
  });
});
