import { test, expect, type Page } from '@playwright/test';
import { REFERENCE_URL, computed, ready } from './helpers';

/**
 * Parcours utilisateur :
 *   « En tant que visiteur sur mobile, je veux la même mise en page adaptée
 *     que celle prévue au design. »
 */

const VIEWPORTS = [
  { label: 'tablette (880px)', width: 880, height: 900 },
  { label: 'mobile (390px)', width: 390, height: 844 },
];

const CHECKS: Array<{ name: string; ref: string; site?: string; props: string[] }> = [
  { name: 'liens de navigation', ref: '.nav-link', props: ['display'] },
  { name: 'sous-titre du logo', ref: '.logo-sub', props: ['display'] },
  {
    name: 'bouton téléphone',
    ref: '.nav-phone',
    props: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-size'],
  },
  { name: 'tampon du héros', ref: '.hero-stamp', props: ['left', 'bottom'] },
  { name: 'mosaïque', ref: '.mosaic', props: ['grid-template-rows'] },
  { name: 'en-tête', ref: '.site-header', props: ['gap', 'padding-left', 'padding-right'] },
  { name: 'grille du héros', ref: '.hero-grid', props: ['grid-template-columns'] },
  { name: 'grille des cartes', ref: '.cards', props: ['grid-template-columns'] },
  { name: 'grille du panneau', ref: '.panel-grid', props: ['grid-template-columns'] },
  { name: 'grille du pied de page', ref: '.footer-grid', props: ['grid-template-columns'] },
];

for (const viewport of VIEWPORTS) {
  test.describe(`adaptation ${viewport.label}`, () => {
    let reference: Page;

    test.beforeAll(async ({ browser }) => {
      reference = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      await reference.goto(REFERENCE_URL);
      await ready(reference);
    });

    test.afterAll(async () => {
      await reference.close();
    });

    for (const check of CHECKS) {
      test(`${check.name} — identique au design`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await ready(page);

        const expected = await computed(reference, check.ref, check.props);
        const actual = await computed(page, check.site ?? check.ref, check.props);

        expect(expected).not.toBeNull();
        expect(actual).not.toBeNull();
        expect(actual).toEqual(expected);
      });
    }

    test('aucun débordement horizontal', async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await ready(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
