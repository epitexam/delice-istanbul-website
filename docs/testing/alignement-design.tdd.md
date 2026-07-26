# TDD — Alignement de l'implémentation Astro sur le design de référence

**Source des parcours** : aucun `*.plan.md`. Les parcours ont été dérivés pendant ce cycle TDD, à partir du design fourni par le client (`~/Downloads/delices-istanbul.html`), versionné dans le dépôt sous `tests/fixtures/reference-design.html` pour rendre les tests reproductibles.

## Parcours utilisateurs

1. **Visiteur** — « Je veux que le site produise exactement le rendu du design validé, afin de retrouver l'identité de Délices Istanbul. »
2. **Visiteur mobile** — « Je veux la même mise en page adaptée que celle prévue au design. »
3. **Visiteur anglophone** — « Je veux basculer le site en anglais sans JavaScript, afin de lire les informations pratiques. »
4. **Mainteneur** — « Je veux que le site compilé ne contienne ni variable CSS fantôme ni règle morte, afin que le design reste fidèle après refactorisation. »

## Rapport par anomalie

| # | Anomalie | RED | GREEN |
|---|----------|-----|-------|
| 1 | `--color-primary-light` et `--font-size-script-hero` référencées mais jamais définies : le mot « Délices » du logo perdait son rouge clair, le script « 100% halal » du héros retombait à 16px au lieu de 54px | `vitest run` → `missing: ['--color-primary-light','--font-size-script-hero']` ; `playwright` → `font-size: 54px` attendu, `16px` reçu | tokens ajoutés dans `colors.css` / `typography.css` ; les deux tests passent |
| 2 | Couleur de texte du corps de page erronée : `--color-text-on-dark` pointait sur le crème `#f3e7d1` au lieu du `#eaddc8` du design | `playwright` → `color: rgb(234,221,200)` attendu, `rgb(243,231,209)` reçu (en-tête, logo, héros, cadre photo) | token brut `--color-text` ajouté et branché sur `--color-text-on-dark` |
| 3 | `.page { padding-top: 90px }` insérait un bandeau encré au-dessus du héros, absent du design | `playwright` → `.hero` top `0` attendu, `90` reçu | règle supprimée de `Layout.astro` et `global.css` |
| 4 | Titres du panneau « Horaires » et de la section « Nous trouver » à la mauvaise échelle : les règles `.panel .title` / `.address-title` visaient une classe `.title` qui n'existe plus depuis le passage aux composants | `playwright` → `46px` attendu / `58px` reçu, et `50px` attendu / `58px` reçu | variantes `size="panel"` et `size="address"` ajoutées à `Heading.astro` |
| 5 | Script « service continu » du panneau en rouge vif au lieu du rouge clair | `playwright` → `rgb(224,67,61)` attendu, `rgb(207,46,42)` reçu | `ScriptText color="red-light"` dans `InfoSection.astro` |
| 6 | Règles scopées écrites dans le mauvais composant, donc jamais appliquées : `.heading-cream` (ReviewsSection) et `.address-title span` (AddressSection) ciblaient un élément rendu par `Heading.astro` | `vitest run` → `misplaced: ['.address-title[data-astro-cid-f5ltk3rk]','.heading-cream[data-astro-cid-xoogknsx]']` | prop `tone="cream"` sur `Heading`, classe `.address-city` propre à `AddressSection` |
| 7 | Attribut `style` vide émis sur chaque titre (prop `style` inutilisée de `Heading.astro`) | `vitest run` → 6 balises `<h1 style …>` / `<h2 style …>` | prop supprimée |
| 8 | Régressions introduites par le nettoyage de `base.css` : `.footer-bottom` et `.days` avaient perdu toute règle | `playwright` → `.footer-bottom` `display:flex` attendu / `block` reçu ; `.days` `margin-top:26px` attendu / `0px` reçu | règles replacées dans `FooterSection.astro` et `InfoSection.astro` |

## Spécification de test

| # | Garantie | Fichier / commande | Type | Résultat |
|---|----------|--------------------|------|----------|
| 1 | Aucune variable CSS n'est référencée sans être définie dans le bundle compilé | `tests/unit/build-output.test.ts:ne référence aucune variable non définie` | unit | PASS |
| 2 | Aucun style scopé n'est déclaré dans un composant qui ne rend pas l'élément visé | `tests/unit/build-output.test.ts:ne déclare pas de style scopé dans le mauvais composant` | unit | PASS |
| 3 | Le HTML généré n'émet pas d'attribut `style` vide | `tests/unit/build-output.test.ts:n'émet pas d'attribut style vide` | unit | PASS |
| 4 | Les ancres `#top`, `#maison`, `#cuisine`, `#infos`, `#adresse` existent | `tests/unit/build-output.test.ts:conserve les identifiants de section` | unit | PASS |
| 5 | Données structurées `Restaurant`, métadonnées et polices identiques au design | `tests/unit/build-output.test.ts:parité SEO` (3 tests) | unit | PASS |
| 6 | 106 éléments (en-tête, héros, bandeau, 4 sections, pied) rendent des styles calculés identiques au design sur 30 propriétés | `tests/e2e/design-parity.spec.ts` | E2E | PASS |
| 7 | Le héros démarre à `top: 0`, comme le design | `tests/e2e/design-parity.spec.ts:le héros démarre en haut de page` | E2E | PASS |
| 8 | Le conteneur central a la même largeur et la même position que le design | `tests/e2e/design-parity.spec.ts:la largeur du conteneur central` | E2E | PASS |
| 9 | Une ancre de navigation s'arrête au même pixel que dans le design, sous l'en-tête fixe | `tests/e2e/design-parity.spec.ts:les ancres de navigation` | E2E | PASS |
| 10 | À 880px et 390px, navigation, logo, bouton téléphone, tampon, mosaïque et les 4 grilles se comportent comme le design | `tests/e2e/responsive.spec.ts` (20 tests) | E2E | PASS |
| 11 | Aucun débordement horizontal à 880px et 390px | `tests/e2e/responsive.spec.ts:aucun débordement horizontal` | E2E | PASS |
| 12 | Le français s'affiche par défaut, bouton FR actif | `tests/e2e/i18n.spec.ts` (2 tests) | E2E | PASS |
| 13 | La bascule EN change navigation, prose, cartes, horaires, avis et contacts — y compris les contenus passés en props de composants | `tests/e2e/i18n.spec.ts:cliquer sur EN bascule toute la page` | E2E | PASS |
| 14 | Le retour en FR restaure le français | `tests/e2e/i18n.spec.ts:revenir en FR` | E2E | PASS |

## Couverture

Le projet est un site statique sans logique métier : la couverture pertinente est la couverture **du rendu**, pas des branches JavaScript. Elle est mesurée par comparaison pixel entre la page compilée et le design de référence, sur cinq largeurs :

```
 390px : 390x7341  — 0 pixel différent (0.0000 %)
 520px : 520x6742  — 0 pixel différent (0.0000 %)
 880px : 880x5064  — 0 pixel différent (0.0000 %)
1024px : 1024x4627 — 0 pixel différent (0.0000 %)
1440px : 1440x5095 — 0 pixel différent (0.0000 %)
```

Commande de validation finale :

```
$ npm test
 Test Files  1 passed (1)
      Tests  7 passed (7)
  135 passed (31.1s)
```

## Limites connues

- Les tests de parité comparent des propriétés calculées sur un jeu de 106 éléments représentatifs, pas l'intégralité du DOM ; le comparatif pixel ci-dessus couvre le reste, mais il est exécuté à la main et n'est pas committé comme test (il dépend du chargement réseau des polices Google, source de faux positifs en CI).
- Un seul navigateur (Chromium). Firefox et WebKit rendraient des métriques de texte légèrement différentes des deux côtés ; la comparaison resterait valable mais n'a pas été exécutée.
- Les emplacements photo (`.photo-hint`) et les avis Google sont des marque-places, conformes au design fourni : ils restent à remplacer par de vrais contenus.
