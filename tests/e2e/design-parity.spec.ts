import { test, expect, type Page } from '@playwright/test';
import { REFERENCE_URL, computed, box, ready } from './helpers';

/**
 * Parcours utilisateur couvert :
 *   « En tant que visiteur, je veux que le site produise exactement le rendu
 *     du design validé, afin de retrouver l'identité de Délices Istanbul. »
 *
 * Chaque paire ci-dessous confronte un élément du design de référence
 * (tests/fixtures/reference-design.html) à son équivalent dans la page Astro.
 * Les noms de classes diffèrent parfois (composants atomiques), pas le rendu.
 */

const BOX_PROPS = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-transform',
  'display',
  'align-self',
  'align-items',
  'justify-content',
  'flex-direction',
  'flex-wrap',
  'gap',
  'position',
  'background-image',
  'opacity',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-bottom',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-color',
  'box-shadow',
];

type Pair = { name: string; ref: string; site?: string; props?: string[] };

const PAIRS: Pair[] = [
  // ---------- En-tête ----------
  { name: 'en-tête', ref: '.site-header' },
  { name: 'navigation', ref: '.site-nav' },
  { name: 'logo', ref: '.logo' },
  { name: 'logo — barre', ref: '.logo-bar' },
  { name: 'logo — pile', ref: '.logo-stack' },
  { name: 'logo — ligne', ref: '.logo-line' },
  { name: 'logo — mot', ref: '.logo-word' },
  { name: 'logo — nom', ref: '.logo-name' },
  { name: 'logo — sous-titre', ref: '.logo-sub' },
  { name: 'lien de navigation', ref: '.nav-link' },
  { name: 'sélecteur de langue', ref: '.lang-switch' },
  { name: 'bouton de langue', ref: '.lang-btn' },
  { name: 'bouton téléphone', ref: '.nav-phone' },

  // ---------- Héros ----------
  { name: 'héros', ref: '.hero' },
  { name: 'héros — texture', ref: '.hero-texture' },
  { name: 'héros — halo', ref: '.hero-glow' },
  { name: 'héros — grille', ref: '.hero-grid' },
  { name: 'héros — actions', ref: '.hero-actions' },
  { name: 'héros — média', ref: '.hero-media' },
  { name: 'héros — étiquette', ref: '.hero-tag', site: '.eyebrow--size-hero' },
  { name: 'héros — titre', ref: '.hero-title', site: 'h1.heading' },
  { name: 'héros — script', ref: '.hero-script', site: '.script-text--hero' },
  { name: 'héros — chapô', ref: '.hero-lede' },
  { name: 'héros — bouton commander', ref: '.btn-order' },
  { name: 'héros — bouton fantôme', ref: '.btn-ghost' },
  { name: 'héros — note', ref: '.hero-note' },
  { name: 'héros — cadre photo', ref: '.hero-frame' },
  { name: 'héros — tampon', ref: '.hero-stamp' },
  { name: 'héros — tampon principal', ref: '.hero-stamp-main' },
  { name: 'héros — tampon secondaire', ref: '.hero-stamp-sub' },
  { name: 'emplacement photo', ref: '.photo-hint' },

  // ---------- Bandeau ----------
  { name: 'bandeau', ref: '.strip' },
  { name: 'bandeau — contenu', ref: '.strip-inner' },
  { name: 'bandeau — séparateur', ref: '.strip-sep' },

  // ---------- La maison ----------
  { name: 'maison — section', ref: '#maison' },
  { name: 'maison — surtitre', ref: '#maison .eyebrow' },
  { name: 'maison — titre', ref: '#maison h2' },
  { name: 'maison — script', ref: '#maison .script', site: '#maison .script-text' },
  { name: 'maison — texte', ref: '#maison .prose' },
  { name: 'maison — bloc chiffres', ref: '#maison .stats' },
  { name: 'maison — chiffre', ref: '#maison .stat' },
  { name: 'maison — chiffre (nombre)', ref: '#maison .stat-num' },
  { name: 'maison — chiffre (libellé)', ref: '#maison .stat-label' },
  { name: 'maison — chiffre rouge', ref: '#maison .stat--red' },
  { name: 'maison — mosaïque', ref: '.mosaic' },
  { name: 'maison — cellule mosaïque', ref: '.mosaic-cell' },
  { name: 'maison — cellule haute', ref: '.mosaic-cell--tall' },

  // ---------- Notre cuisine ----------
  { name: 'cuisine — section', ref: '#cuisine' },
  { name: 'cuisine — entête', ref: '#cuisine .section-head' },
  { name: 'cuisine — titre', ref: '#cuisine h2' },
  { name: 'cuisine — carte', ref: '.card' },
  { name: 'cuisine — média carte', ref: '.card-media' },
  { name: 'cuisine — corps carte', ref: '.card-body' },
  { name: 'cuisine — surtitre carte', ref: '.card-kicker' },
  { name: 'cuisine — titre carte', ref: '.card-title' },
  { name: 'cuisine — texte carte', ref: '.card-text' },

  // ---------- Avis ----------
  { name: 'avis — section', ref: '.section--red' },
  { name: 'avis — rayures', ref: '.stripes' },
  { name: 'avis — entête', ref: '.reviews-head' },
  { name: 'avis — grille', ref: '.reviews' },
  { name: 'avis — surtitre', ref: '.section--red .eyebrow' },
  { name: 'avis — titre', ref: '.section--red h2' },
  { name: 'avis — bouton Google', ref: '.btn-google' },
  { name: 'avis — carte', ref: '.review' },
  { name: 'avis — étoiles', ref: '.review-stars' },
  { name: 'avis — citation', ref: '.review blockquote' },
  { name: 'avis — signature', ref: '.review figcaption' },

  // ---------- Horaires & infos ----------
  { name: 'infos — section', ref: '#infos' },
  { name: 'infos — panneau', ref: '.panel' },
  { name: 'infos — grille panneau', ref: '.panel-grid' },
  { name: 'infos — surtitre rouge', ref: '#infos .eyebrow--red' },
  { name: 'infos — titre', ref: '#infos h2' },
  { name: 'infos — script', ref: '#infos .script', site: '#infos .script-text' },
  { name: 'infos — colonne panneau', ref: '.panel-col' },
  { name: 'infos — colonne espacée', ref: '.panel-col--gap' },
  { name: 'infos — liste des jours', ref: '.days' },
  { name: 'infos — groupe de puces', ref: '.chips' },
  { name: 'infos — ligne jour', ref: '.day' },
  { name: 'infos — nom du jour', ref: '.day-name' },
  { name: 'infos — horaires du jour', ref: '.day-hours' },
  { name: 'infos — sous-titre', ref: '.sub-title' },
  { name: 'infos — puce', ref: '.chip', site: '.badge' },
  { name: 'infos — puce pleine', ref: '.chip--solid', site: '.badge--solid' },
  { name: 'infos — encadré', ref: '.callout' },
  { name: 'infos — texte encadré', ref: '.callout p' },

  // ---------- Adresse ----------
  { name: 'adresse — section', ref: '#adresse' },
  { name: 'adresse — titre', ref: '#adresse h2' },
  { name: 'adresse — code postal', ref: '#adresse h2 span' },
  { name: 'adresse — liste contacts', ref: '.contact-list' },
  { name: 'adresse — ligne contact', ref: '.contact-row' },
  { name: 'adresse — libellé contact', ref: '.contact-label' },
  { name: 'adresse — valeur contact', ref: '.contact-value' },
  { name: 'adresse — e-mail', ref: '.contact-value--mail' },
  { name: 'adresse — bouton itinéraire', ref: '.btn-map' },
  { name: 'adresse — carte', ref: '.map' },

  // ---------- Pied de page ----------
  { name: 'pied — conteneur', ref: '.site-footer' },
  { name: 'pied — grille', ref: '.footer-grid' },
  { name: 'pied — logo', ref: '.footer-logo' },
  { name: 'pied — logo mot', ref: '.footer-logo-word' },
  { name: 'pied — logo nom', ref: '.footer-logo-name' },
  { name: 'pied — texte', ref: '.footer-text' },
  { name: 'pied — colonne', ref: '.footer-col' },
  { name: 'pied — entête colonne', ref: '.footer-head' },
  { name: 'pied — lien', ref: '.footer-link' },
  { name: 'pied — bas de page', ref: '.footer-bottom' },
];

test.describe('parité visuelle avec le design de référence', () => {
  let reference: Page;

  test.beforeAll(async ({ browser }) => {
    reference = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await reference.goto(REFERENCE_URL);
    await ready(reference);
  });

  test.afterAll(async () => {
    await reference.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ready(page);
  });

  for (const pair of PAIRS) {
    const siteSelector = pair.site ?? pair.ref;
    const props = pair.props ?? BOX_PROPS;

    test(`${pair.name} — styles calculés identiques`, async ({ page }) => {
      const expected = await computed(reference, pair.ref, props);
      const actual = await computed(page, siteSelector, props);

      expect(expected, `sélecteur absent du design : ${pair.ref}`).not.toBeNull();
      expect(actual, `sélecteur absent du site : ${siteSelector}`).not.toBeNull();
      expect(actual).toEqual(expected);
    });
  }

  test('le héros démarre en haut de page, sans bandeau parasite', async ({ page }) => {
    const expected = await box(reference, '.hero');
    const actual = await box(page, '.hero');

    expect(actual!.top).toBe(expected!.top);
    expect(actual!.top).toBe(0);
  });

  test('la largeur du conteneur central est identique', async ({ page }) => {
    const expected = await box(reference, '#maison .wrap');
    const actual = await box(page, '#maison .wrap');

    expect(actual!.width).toBe(expected!.width);
    expect(actual!.left).toBe(expected!.left);
  });

  test('les ancres de navigation s’arrêtent au même endroit que le design', async ({
    page,
    browser,
  }) => {
    // Défilement instantané : on mesure la position d'arrêt, pas l'animation.
    const jumpToInfos = async (target: Page) => {
      await target.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
      await target.evaluate(() => document.querySelector('#infos')!.scrollIntoView());
      return (await box(target, '#infos'))!.top;
    };

    // Page de référence dédiée : ce test fait défiler la page, et la référence
    // partagée par le describe est mesurée par d'autres tests à scroll nul.
    const ownReference = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await ownReference.goto(REFERENCE_URL);
    await ready(ownReference);

    const expected = await jumpToInfos(ownReference);
    await ownReference.close();

    const actual = await jumpToInfos(page);

    expect(actual).toBe(expected);

    // Et la section reste bien visible sous l'en-tête fixe.
    const headerHeight = (await box(page, '.site-header'))!.height;
    expect(actual).toBeGreaterThanOrEqual(headerHeight);
  });
});
