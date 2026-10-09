import { test, expect } from '@playwright/test';
import { verifierAccessibilite } from './outils.js';

/**
 * Sur téléphone : rien ne déborde de l'écran, aucun texte n'est coupé, et aucun bouton ne
 * chevauche un texte ou ne lui est collé. Testé à 390 px (iPhone) et 360 px (Android courant),
 * en clair et en sombre.
 */
const LARGEURS = [390, 360];

const sansDefilementHorizontal = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/** Éléments sortis de l'écran ou dont le texte est coupé (scrollWidth > clientWidth). */
const textesCoupes = (page, selecteur) =>
  page.evaluate((selecteur) => {
    const visibles = [...document.querySelectorAll(selecteur)].filter((e) => e.offsetParent);
    return visibles
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.left < -1 || r.right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 1;
      })
      .map((e) => `${e.className} : ${e.textContent.trim().slice(0, 60)}`);
  }, selecteur);

/** Écart vertical entre le bas d'un élément et le haut d'un autre. */
const ecart = (page, haut, bas) =>
  page.evaluate(
    ([haut, bas]) =>
      document.querySelector(bas).getBoundingClientRect().top -
      document.querySelector(haut).getBoundingClientRect().bottom,
    [haut, bas],
  );

/**
 * Paires (bouton, texte) qui se chevauchent ou sont à moins de 4 px, dans chaque carte :
 * boutons d'action contre titre, résumé, date et outils.
 */
const chevauchementsCartes = (page) =>
  page.evaluate(() => {
    const fautes = [];
    const proches = (a, b) =>
      a.left < b.right + 4 && b.left < a.right + 4 && a.top < b.bottom + 4 && b.top < a.bottom + 4;
    for (const carte of [...document.querySelectorAll('.carte')].slice(0, 40)) {
      const boutons = [...carte.querySelectorAll('.carte__action')].map((b) =>
        b.getBoundingClientRect(),
      );
      const textes = [
        ...carte.querySelectorAll(
          '.carte__titre, .carte__resume, .carte__date, .outil-mini, .badge, .carte__niveau',
        ),
      ].map((t) => [t, t.getBoundingClientRect()]);
      for (const b of boutons) {
        for (const [t, r] of textes) {
          if (proches(b, r)) fautes.push(`${carte.dataset.id} : ${t.className}`);
        }
      }
    }
    return fautes;
  });

for (const largeur of LARGEURS) {
  test.describe(`à ${largeur} px`, () => {
    test.use({ viewport: { width: largeur, height: 800 } });

    test('accueil : pas de débordement, pastilles et filtres lisibles', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.carte').first()).toBeVisible();
      expect(await sansDefilementHorizontal(page)).toBe(true);
      expect(
        await textesCoupes(
          page,
          '.pastille__corps, .bandeau__actions .bouton, .menu-filtre__bouton, .resultats__titres h2, .actif, #hasard',
        ),
      ).toEqual([]);
      // Bandeau : la pastille de l'outil reste visible, à l'écart des boutons.
      await expect(page.locator('.bandeau__pastille')).toBeVisible();
      const pastille = await page.locator('.bandeau__pastille').boundingBox();
      const actions = await page.locator('.bandeau__actions').boundingBox();
      expect(pastille.x + pastille.width + 4).toBeLessThanOrEqual(actions.x);
      // Le titre « Catégories » respire au-dessus des pastilles.
      expect(await ecart(page, '.categories__legende', '.pastilles')).toBeGreaterThanOrEqual(12);
      // Le texte d'exemple de la recherche tient dans le champ.
      const exemple = await page.locator('#recherche').evaluate((champ) => {
        const mesure = document.createElement('span');
        mesure.style.font = getComputedStyle(champ).font;
        mesure.style.position = 'absolute';
        mesure.textContent = champ.placeholder;
        document.body.append(mesure);
        const style = getComputedStyle(champ);
        const ok =
          mesure.offsetWidth <=
          champ.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        mesure.remove();
        return ok;
      });
      expect(exemple).toBe(true);
    });

    for (const theme of ['light', 'dark']) {
      test(`bandeau (${theme === 'light' ? 'clair' : 'sombre'}) : tout tient, la roue seule, le logo en dernier`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: theme });
        // Douze favoris : le compteur à deux chiffres, le cas le plus large.
        await page.goto('/');
        await expect(page.locator('.carte').first()).toBeVisible();
        await page.evaluate(() => {
          const ids = [...document.querySelectorAll('.carte')]
            .slice(0, 12)
            .map((c) => c.dataset.id);
          localStorage.setItem('skazy-prompts:favoris', JSON.stringify(ids));
        });
        await page.reload();
        await expect(page.locator('.bandeau__actions .compteur')).toHaveText('12');
        expect(await sansDefilementHorizontal(page)).toBe(true);
        expect(await textesCoupes(page, '.bandeau__interieur > *, .bandeau__actions > *')).toEqual(
          [],
        );

        // De gauche à droite, sans chevauchement : pastille, actions, roue, filet, logo.
        const boites = await page
          .locator('.bandeau__interieur')
          .evaluate((b) => [...b.children].map((e) => e.getBoundingClientRect().toJSON()));
        expect(boites).toHaveLength(5);
        for (let i = 1; i < boites.length; i += 1) {
          expect(boites[i].left, `élément ${i}`).toBeGreaterThanOrEqual(boites[i - 1].right + 4);
        }
        expect(boites.at(-1).right).toBeLessThanOrEqual(largeur - 8);

        // « Les outils » : la roue seule, texte masqué mais gardé comme nom du lien.
        const outils = page.getByRole('link', { name: 'Les outils', exact: true });
        await expect(outils.locator('.bandeau__roue')).toBeVisible();
        const zone = await outils.boundingBox();
        expect(zone.width).toBeGreaterThanOrEqual(40);
        expect(zone.height).toBeGreaterThanOrEqual(40);
        const texteVisible = await outils
          .locator('.bandeau__outils-texte')
          .evaluate((t) => t.getBoundingClientRect().width > 1);
        expect(texteVisible).toBe(false);

        // Le nom de l'outil reste un lien vers son accueil, même réduit à la pastille.
        await expect(page.getByRole('link', { name: 'Prompthèque', exact: true })).toHaveAttribute(
          'href',
          './',
        );

        // Le logo du thème, à droite, vers formation.skazy.nc dans un nouvel onglet.
        const logo = page.getByRole('link', { name: 'Site de Skazy Formation (nouvel onglet)' });
        await expect(logo).toHaveAttribute('href', 'https://formation.skazy.nc');
        await expect(logo).toHaveAttribute('target', '_blank');
        await expect(
          logo.locator(theme === 'light' ? '.logo--clair' : '.logo--sombre'),
        ).toBeVisible();
      });
    }

    test('le bouton « Remonter en haut de la page » apparaît aussi sur téléphone', async ({
      page,
    }) => {
      await page.goto('/');
      await expect(page.locator('.carte').first()).toBeVisible();
      const haut = page.getByRole('button', { name: 'Remonter en haut de la page' });
      await expect(haut).toBeHidden();
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
      await expect(haut).toBeVisible();
      const boite = await haut.boundingBox();
      expect([boite.width, boite.height]).toEqual([44, 44]);
      expect(Math.round(largeur - boite.x - boite.width)).toBe(16);
      expect(Math.round(800 - boite.y - boite.height)).toBe(16);
      await haut.tap();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(page.locator('#titre-page')).toBeFocused();
    });

    test('cartes : aucun bouton ne touche un texte', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.carte').first()).toBeVisible();
      expect(await chevauchementsCartes(page)).toEqual([]);
      expect(
        await textesCoupes(page, '.carte__titre, .carte__resume, .outil-mini, .badge'),
      ).toEqual([]);
    });

    test('fiche : en plein écran, rien ne déborde, boutons séparés', async ({ page }) => {
      await page.goto('/');
      for (const id of await page
        .locator('.carte')
        .evaluateAll((cartes) => cartes.slice(0, 12).map((c) => c.dataset.id))) {
        await page.goto(`/#${id}`);
        const fiche = page.getByRole('dialog');
        await expect(fiche).toBeVisible();
        const boite = await fiche.boundingBox();
        expect(boite.width).toBeLessThanOrEqual(largeur);
        const largeurContenu = await fiche.evaluate((d) => d.scrollWidth <= d.clientWidth);
        expect(largeurContenu, id).toBe(true);
        expect(
          await textesCoupes(
            page,
            '.fiche__titre, .fiche__actions .bouton, .prompt__titre, .prompt__copier, .fiche__position',
          ),
          id,
        ).toEqual([]);
        // Le titre d'un prompt et son bouton Copier ne se touchent pas.
        const collisions = await fiche.locator('.prompt__entete').evaluateAll(
          (entetes) =>
            entetes.filter((e) => {
              const t = e.querySelector('.prompt__titres').getBoundingClientRect();
              const b = e.querySelector('.prompt__copier').getBoundingClientRect();
              return (
                t.left < b.right + 4 && b.left < t.right + 4 && t.top < b.bottom && b.top < t.bottom
              );
            }).length,
        );
        expect(collisions, id).toBe(0);
      }
    });

    test('filtres : les menus tiennent sur une ligne et s’ouvrent en bas de l’écran', async ({
      page,
    }) => {
      await page.goto('/');
      await expect(page.locator('.carte').first()).toBeVisible();
      if (largeur >= 390) {
        const hauts = await page
          .locator('.menu-filtre__bouton')
          .evaluateAll((b) => b.map((x) => Math.round(x.getBoundingClientRect().top)));
        expect(new Set(hauts).size, 'niveau, outil et tri sur une ligne').toBe(1);
      }
      // Les pilules ne se touchent pas.
      const boites = await page
        .locator('.menu-filtre__bouton')
        .evaluateAll((b) => b.map((x) => x.getBoundingClientRect().toJSON()));
      for (let i = 0; i < boites.length; i += 1) {
        for (let j = i + 1; j < boites.length; j += 1) {
          const [a, b] = [boites[i], boites[j]];
          const touche =
            a.left < b.right + 4 &&
            b.left < a.right + 4 &&
            a.top < b.bottom + 4 &&
            b.top < a.bottom + 4;
          expect(touche, `pilules ${i} et ${j}`).toBe(false);
        }
      }

      for (const menu of ['niveau', 'outil', 'tri']) {
        await page.locator(`#filtre-${menu}`).click();
        const liste = page.locator(`#filtre-${menu}-liste`);
        await expect(liste).toBeVisible();
        const panneau = await liste.evaluate((l) =>
          l.parentElement.getBoundingClientRect().toJSON(),
        );
        expect(panneau.left).toBeGreaterThanOrEqual(0);
        expect(panneau.right).toBeLessThanOrEqual(largeur + 1);
        expect(Math.round(panneau.bottom)).toBe(800);
        expect(
          await textesCoupes(page, '.menu-filtre__option, .menu-filtre__nom, .menu-filtre__titre'),
        ).toEqual([]);
        // Le voile ferme le panneau.
        await page.mouse.click(largeur / 2, 20);
        await expect(liste).toBeHidden();
      }
      await page.locator('#filtre-outil').click();
      await page
        .locator('#filtre-outil-liste')
        .getByRole('option', { name: /ChatGPT/ })
        .click();
      await expect(page.locator('#filtre-outil')).toHaveText('ChatGPT');
      expect(await sansDefilementHorizontal(page)).toBe(true);
    });

    test('sombre : accueil et fiche accessibles', async ({ page }) => {
      test.slow();
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      await expect(page.locator('.carte').first()).toBeVisible();
      await verifierAccessibilite(page);
      await page.locator('.carte__lien').first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await verifierAccessibilite(page);
    });
  });
}

test('À propos tient dans l’écran du téléphone', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'À propos de la Prompthèque' }).click();
  const dialogue = page.getByRole('dialog', { name: 'À propos' });
  await expect(dialogue).toBeVisible();
  const boite = await dialogue.boundingBox();
  expect(boite.width).toBeLessThanOrEqual(390);
  expect(await textesCoupes(page, '.apropos__categorie, .apropos h3')).toEqual([]);
});
