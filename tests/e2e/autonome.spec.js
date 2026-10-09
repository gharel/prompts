import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { surveillerErreurs } from './outils.js';

const FICHIER = pathToFileURL(
  fileURLToPath(new URL('../../dist/index.html', import.meta.url)),
).href;

test('le fichier s’ouvre hors ligne en double-cliquant, sans aucune requête réseau', async ({
  page,
}) => {
  const erreurs = surveillerErreurs(page);
  const requetes = [];
  page.on('request', (r) => {
    if (!/^(file|data|blob):/.test(r.url())) requetes.push(r.url());
  });
  await page.goto(FICHIER);
  await expect(page.locator('.carte').first()).toBeVisible();
  await expect(page.locator('.bandeau__logo img').first()).toBeVisible();
  // Pastille, roue « Les outils » et logo sont intégrés au fichier et s'affichent.
  const images = await page
    .locator('.bandeau img:visible')
    .evaluateAll((imgs) => imgs.map((i) => [i.className, i.naturalWidth > 0, i.src.slice(0, 5)]));
  expect(images).toEqual([
    ['bandeau__pastille', true, 'data:'],
    ['bandeau__roue', true, 'data:'],
    ['logo logo--clair', true, 'data:'],
  ]);
  // Hors ligne, « ./ » afficherait le dossier : le nom de l'outil recharge le fichier.
  await expect(page.locator('#lien-accueil')).toHaveAttribute('href', 'index.html');
  await page.locator('.carte__lien').first().click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toBeVisible();
  const police = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px Georama');
  });
  expect(police).toBe(true);
  expect(requetes).toEqual([]);
  expect(erreurs).toEqual([]);
});
