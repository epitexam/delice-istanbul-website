import { test, expect } from '@playwright/test';

/**
 * Parcours utilisateur :
 *   « En tant que visiteur anglophone, je veux basculer le site en anglais
 *     sans JavaScript, afin de lire les informations pratiques. »
 */

test.describe('bascule de langue sans JavaScript', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('le français est affiché par défaut', async ({ page }) => {
    await expect(page.locator('.nav-link[href="#maison"] .i18n.fr')).toBeVisible();
    await expect(page.locator('.nav-link[href="#maison"] .i18n.en')).toBeHidden();
    await expect(page.locator('#maison .prose .i18n.fr')).toBeVisible();
    await expect(page.locator('#maison .prose .i18n.en')).toBeHidden();
  });

  test('le bouton FR est actif par défaut', async ({ page }) => {
    const background = await page
      .locator('.lang-btn[for="lang-fr"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).toBe('rgb(207, 46, 42)');
  });

  test('cliquer sur EN bascule toute la page en anglais', async ({ page }) => {
    await page.locator('.lang-btn[for="lang-en"]').click();

    await expect(page.locator('.nav-link[href="#maison"] .i18n.en')).toBeVisible();
    await expect(page.locator('.nav-link[href="#maison"] .i18n.fr')).toBeHidden();
    await expect(page.locator('#maison .prose .i18n.en')).toBeVisible();
    await expect(page.locator('#maison .prose .i18n.fr')).toBeHidden();

    // Les contenus injectés via props de composants doivent basculer aussi.
    await expect(page.locator('.card-kicker .i18n.en').first()).toBeVisible();
    await expect(page.locator('.card-kicker .i18n.fr').first()).toBeHidden();
    await expect(page.locator('.day-name .i18n.en').first()).toBeVisible();
    await expect(page.locator('.day-name .i18n.fr').first()).toBeHidden();
    await expect(page.locator('.review blockquote .i18n.en').first()).toBeVisible();
    await expect(page.locator('.review blockquote .i18n.fr').first()).toBeHidden();
    await expect(page.locator('.contact-label .i18n.en').first()).toBeVisible();
    await expect(page.locator('.contact-label .i18n.fr').first()).toBeHidden();
  });

  test('le bouton EN devient actif après la bascule', async ({ page }) => {
    await page.locator('.lang-btn[for="lang-en"]').click();

    // Le fond est animé (transition 150ms) : on attend sa valeur finale.
    await expect
      .poll(() =>
        page
          .locator('.lang-btn[for="lang-en"]')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .toBe('rgb(207, 46, 42)');
  });

  test('revenir en FR restaure le français', async ({ page }) => {
    await page.locator('.lang-btn[for="lang-en"]').click();
    await page.locator('.lang-btn[for="lang-fr"]').click();

    await expect(page.locator('#maison .prose .i18n.fr')).toBeVisible();
    await expect(page.locator('#maison .prose .i18n.en')).toBeHidden();
  });
});
