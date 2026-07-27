import type { Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** URL file:// du design de référence versionné dans le dépôt. */
export const REFERENCE_URL =
  'file://' + resolve(here, '../fixtures/reference-design.html');

/**
 * Relève les propriétés calculées d'un élément.
 * Retourne null si le sélecteur ne correspond à rien : les tests
 * distinguent ainsi « valeur différente » de « élément absent ».
 */
export async function computed(
  page: Page,
  selector: string,
  properties: string[],
): Promise<Record<string, string> | null> {
  return page.evaluate(
    ({ selector, properties }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = getComputedStyle(el);
      const out: Record<string, string> = {};
      for (const property of properties) out[property] = style.getPropertyValue(property);
      return out;
    },
    { selector, properties },
  );
}

/** Rectangle de l'élément, arrondi au pixel pour absorber le sous-pixel. */
export async function box(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  }, selector);
}

/**
 * Attend que la page soit stable avant toute mesure : polices chargées
 * (métriques de texte figées) et animation d'entrée du héros terminée.
 */
export async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    ).then(() => undefined),
  );
}

