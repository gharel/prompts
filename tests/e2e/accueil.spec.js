import { test, expect } from '@playwright/test';
import { surveillerErreurs, verifierAccessibilite } from './outils.js';

const nombre = async (locator) => Number((await locator.textContent()).match(/\d+/)[0]);
const PAS = 36;

/** Choisit une option dans un menu de filtre (niveau, outil, tri). */
async function choisir(page, menu, option) {
  await page.locator(`#filtre-${menu}`).click();
  await page.locator(`#filtre-${menu}-liste`).getByRole('option', { name: option }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.carte').first()).toBeVisible();
});

test('l’accueil affiche les fiches par lots, sans erreur ni défaut d’accessibilité', async ({
  page,
}) => {
  test.slow();
  const erreurs = surveillerErreurs(page);
  await page.reload();
  await expect(page.locator('.carte').first()).toBeVisible();
  const total = await nombre(page.locator('#titre-resultats'));
  expect(total).toBeGreaterThan(400);
  await expect(page.locator('.carte')).toHaveCount(PAS);
  await expect(page.locator('.resultats__compte')).toHaveText(
    `${PAS} sur ${total} fiches affichées`,
  );
  await page.locator('#afficher-plus').click();
  await expect(page.locator('.carte')).toHaveCount(2 * PAS);
  await expect(page.locator('.carte').nth(PAS).locator('.carte__lien')).toBeFocused();
  await expect(page.locator('#titre-page')).toHaveText('Des techniques de prompt prêtes à copier');
  await verifierAccessibilite(page);
  expect(erreurs).toEqual([]);
});

test('le thème sombre est accessible aussi', async ({ page }) => {
  test.slow();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 20, 20)');
  await verifierAccessibilite(page);
});

test('une catégorie filtre les cartes et s’inscrit dans l’adresse', async ({ page }) => {
  const total = await nombre(page.locator('#titre-resultats'));
  const pastille = page.locator('label.pastille', { hasText: 'Coder' });
  const attendu = await nombre(pastille.locator('.pastille__nombre'));
  await pastille.click();
  await expect(page.locator('#titre-resultats')).toHaveText(`${attendu} fiches`);
  await expect(page.locator('.carte')).toHaveCount(Math.min(attendu, PAS));
  expect(attendu).toBeLessThan(total);
  await expect(page).toHaveURL(/categorie=coder/);
  for (const badge of await page.locator('.carte .badge').allTextContents()) {
    expect(badge).toContain('Coder');
  }
  // Le filtre actif s'affiche et se retire.
  await page.getByRole('button', { name: 'Retirer le filtre : Coder avec l’IA' }).click();
  await expect(page.locator('#titre-resultats')).toHaveText(`${total} fiches`);
});

test('l’adresse avec filtres rouvre la même vue', async ({ page }) => {
  await page.goto('/?categorie=verifier&niveau=debutant');
  await expect(page.locator('.carte').first()).toBeVisible();
  await expect(page.locator('input[name="categorie"][value="verifier"]')).toBeChecked();
  const niveau = page.locator('#filtre-niveau');
  await expect(niveau).toHaveText('Débutant');
  await expect(niveau).toHaveClass(/menu-filtre__bouton--actif/);
  await expect(niveau).toHaveAttribute('aria-label', 'Niveau : Débutant');
  for (const n of await page.locator('.carte__niveau').allTextContents()) {
    expect(n.trim()).toBe('Débutant');
  }
});

test('la recherche ignore les accents et propose de tout effacer quand rien ne correspond', async ({
  page,
}) => {
  await page.locator('#recherche').fill('verifier');
  await expect(page).toHaveURL(/q=verifier/);
  const n = await nombre(page.locator('#titre-resultats'));
  expect(n).toBeGreaterThan(0);

  await page.locator('#recherche').fill('zzzzqqq');
  await expect(page.locator('.vide')).toBeVisible();
  await expect(page.locator('#titre-resultats')).toHaveText('Aucune fiche');
  await page.locator('.vide').getByRole('button', { name: 'Effacer les filtres' }).click();
  await expect(page.locator('#recherche')).toHaveValue('');
  await expect(page.locator('.carte').first()).toBeVisible();
});

test('les menus de niveau, d’outil et de tri se combinent', async ({ page }) => {
  // Chaque choix annonce son nombre de fiches, et la pilule montre le filtre actif.
  await page.locator('#filtre-niveau').click();
  const option = page.locator('#filtre-niveau-liste').getByRole('option', { name: /Avancé/ });
  const attendu = await nombre(option.locator('.menu-filtre__nombre'));
  await option.click();
  await expect(page.locator('#filtre-niveau-liste')).toBeHidden();
  await expect(page.locator('#titre-resultats')).toHaveText(`${attendu} fiches`);
  await expect(page.locator('#filtre-niveau')).toHaveText('Avancé');

  await choisir(page, 'outil', /Claude Code/);
  expect(await page.locator('.carte').count()).toBeGreaterThan(0);
  for (const outils of await page.locator('.carte__outils').allTextContents()) {
    expect(outils).toContain('Claude Code');
  }
  await choisir(page, 'tri', 'Plus anciennes');
  await expect(page.locator('#filtre-tri')).toHaveText('Plus anciennes');
  const dates = await page.locator('.carte time').evaluateAll((t) => t.map((x) => x.dateTime));
  expect([...dates].sort()).toEqual(dates);
  await expect(page.getByRole('button', { name: 'Tout effacer' })).toBeVisible();
  await page.getByRole('button', { name: 'Tout effacer' }).click();
  await expect(page.locator('#filtre-niveau')).toHaveText('Niveau');
});

test('un menu se pilote au clavier et se ferme avec Échap', async ({ page }) => {
  const bouton = page.locator('#filtre-niveau');
  await bouton.focus();
  await page.keyboard.press('Enter');
  await expect(bouton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#filtre-niveau-tous')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#filtre-niveau-debutant')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(bouton).toHaveText('Débutant');
  await expect(bouton).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#filtre-niveau-liste')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#filtre-niveau-liste')).toBeHidden();
  await expect(bouton).toBeFocused();
  // Un clic ailleurs ferme aussi le menu.
  await bouton.click();
  await page.locator('#titre-resultats').click();
  await expect(page.locator('#filtre-niveau-liste')).toBeHidden();
});

test('les favoris se gardent et se filtrent', async ({ page }) => {
  await page.locator('.carte').nth(1).locator('.bouton-favori').click();
  await page.locator('.carte').nth(3).locator('.bouton-favori').click();
  await expect(page.locator('#bouton-favoris .compteur')).toHaveText('2');
  await page.reload();
  await expect(page.locator('#bouton-favoris .compteur')).toHaveText('2');
  await page.locator('#bouton-favoris').click();
  await expect(page.locator('.carte')).toHaveCount(2);
  await expect(page).toHaveURL(/favoris=1/);
  await page.locator('.carte').first().locator('.bouton-favori').click();
  await expect(page.locator('.carte')).toHaveCount(1);
});

test('aucun favori : un message explique comment en ajouter', async ({ page }) => {
  await page.locator('#bouton-favoris').click();
  await expect(page.locator('.vide h3')).toHaveText('Pas encore de favori');
  await page.getByRole('button', { name: 'Voir toutes les fiches' }).click();
  await expect(page.locator('.carte').first()).toBeVisible();
});

test('le bouton Copier d’une carte copie le prompt', async ({ page }) => {
  await page
    .locator('.carte')
    .first()
    .getByRole('button', { name: /Copier le prompt/ })
    .click();
  await expect(page.locator('#toast')).toContainText(/copiée?/);
  const copie = await page.evaluate(() => navigator.clipboard.readText());
  expect(copie.length).toBeGreaterThan(20);
});

test('le thème se change et se retient', async ({ page }) => {
  const bouton = page.locator('#bouton-theme');
  await bouton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await bouton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await bouton.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
});

test('À propos présente les catégories et mène à l’une d’elles', async ({ page }) => {
  test.slow();
  await page.getByRole('button', { name: 'À propos de la Prompthèque' }).click();
  const dialogue = page.getByRole('dialog', { name: 'À propos' });
  await expect(dialogue).toBeVisible();
  await verifierAccessibilite(page);
  await dialogue.getByRole('button', { name: /Images, vidéo et design/ }).click();
  await expect(dialogue).toBeHidden();
  await expect(page.locator('input[name="categorie"][value="creer"]')).toBeChecked();
});
