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

/** Les options affichées des listes déroulantes tiennent dans leur champ. */
const selectsCoupes = (page) =>
  page.evaluate(() => {
    const mesure = document.createElement('span');
    document.body.append(mesure);
    const coupes = [...document.querySelectorAll('select')].filter((select) => {
      const style = getComputedStyle(select);
      mesure.style.font = style.font;
      mesure.style.position = 'absolute';
      mesure.style.whiteSpace = 'nowrap';
      mesure.textContent = select.selectedOptions[0].textContent;
      const place =
        select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return mesure.offsetWidth > place;
    });
    mesure.remove();
    return coupes.map((s) => s.id);
  });

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
          '.pastille__corps, .bandeau__actions .bouton, .filtre__libelle, .resultats__titres h2, .actif',
        ),
      ).toEqual([]);
      expect(await selectsCoupes(page)).toEqual([]);
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

    test('sombre : accueil et fiche accessibles', async ({ page }) => {
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
