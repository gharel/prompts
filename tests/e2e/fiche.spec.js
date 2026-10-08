import { test, expect } from '@playwright/test';
import { surveillerErreurs, verifierAccessibilite } from './outils.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.carte').first()).toBeVisible();
});

test('un clic sur une carte ouvre sa fiche complète', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  const carte = page.locator('.carte').first();
  const titre = await carte.locator('.carte__titre').textContent();
  await carte.locator('.carte__lien').click();
  const fiche = page.getByRole('dialog');
  await expect(fiche.getByRole('heading', { level: 2 })).toHaveText(titre);
  await expect(page).toHaveURL(/#[a-z0-9-]+$/);
  // Titre d'onglet : « Page · Nom · Skazy Formation ».
  await expect(page).toHaveTitle(/^\S.* · Prompthèque · Skazy Formation$/);
  await expect(fiche.locator('.fiche__section').first()).toContainText('La technique');
  await expect(fiche.locator('.prompt').first()).toBeVisible();
  await expect(fiche.locator('.fiche__source a')).toHaveAttribute(
    'href',
    /^https:\/\/www\.theneurondaily\.com\/p\//,
  );
  await verifierAccessibilite(page);
  expect(erreurs).toEqual([]);
});

test('la fiche se ferme avec Échap et rend la main à la carte', async ({ page }) => {
  const lien = page.locator('.carte__lien').nth(2);
  await lien.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).not.toHaveURL(/#/);
  await expect(page).toHaveTitle('Prompthèque · Skazy Formation');
  await expect(lien).toBeFocused();
});

test('les flèches passent à la fiche suivante de la liste filtrée', async ({ page }) => {
  await page.locator('label.pastille', { hasText: 'Formuler' }).click();
  const titres = await page.locator('.carte__titre').allTextContents();
  // La navigation parcourt toutes les fiches filtrées, pas seulement le lot affiché.
  const total = (await page.locator('#titre-resultats').textContent()).match(/\d+/)[0];
  await page.locator('.carte__lien').first().click();
  const fiche = page.getByRole('dialog');
  await expect(fiche.locator('.fiche__position')).toHaveText(`Fiche 1 sur ${total}`);
  await page.keyboard.press('ArrowRight');
  await expect(fiche.getByRole('heading', { level: 2 })).toHaveText(titres[1]);
  await fiche.getByRole('button', { name: /Fiche précédente/ }).click();
  await expect(fiche.getByRole('heading', { level: 2 })).toHaveText(titres[0]);
});

test('Copier le prompt copie le texte exact du prompt', async ({ page }) => {
  await page.locator('.carte__lien').first().click();
  const fiche = page.getByRole('dialog');
  const texte = await fiche.locator('.prompt__texte').first().textContent();
  await fiche.locator('#copier-principal').click();
  await expect(page.locator('#toast')).toContainText(/copiée?/);
  // Le presse-papiers de Windows rend des fins de ligne CR LF.
  const copie = await page.evaluate(() => navigator.clipboard.readText());
  expect(copie.replace(/\r\n/g, '\n')).toBe(texte);
});

test('un lien vers une fiche l’ouvre directement, et le lien se copie', async ({ page }) => {
  const id = await page.locator('.carte').nth(5).getAttribute('data-id');
  await page.goto(`/#${id}`);
  const fiche = page.getByRole('dialog');
  await expect(fiche).toBeVisible();
  await fiche.getByRole('button', { name: 'Copier le lien' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`#${id}$`));
});

test('le favori se marque depuis la fiche', async ({ page }) => {
  await page.locator('.carte__lien').first().click();
  const bouton = page.getByRole('dialog').locator('.bouton--favori-fiche');
  await expect(bouton).toHaveAttribute('aria-pressed', 'false');
  await bouton.click();
  await expect(bouton).toHaveAttribute('aria-pressed', 'true');
  await expect(bouton).toContainText('Dans mes favoris');
  await expect(page.locator('#bouton-favoris .compteur')).toHaveText('1');
});

test('une fiche voisine de la même catégorie s’ouvre depuis la fiche', async ({ page }) => {
  await page.locator('.carte__lien').first().click();
  const fiche = page.getByRole('dialog');
  const lien = fiche.locator('.similaire').first();
  const titre = await lien.locator('.similaire__titre').textContent();
  await lien.click();
  await expect(fiche.getByRole('heading', { level: 2 })).toHaveText(titre);
});
