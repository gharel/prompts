/**
 * npm run icones : lit la liste ICONES de src/js/icones.js et écrit leurs tracés SVG
 * (Font Awesome Free) dans src/js/icones-donnees.js.
 * Un nom seul vient du style solid ; « regular/nom » vient du style regular (contour).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = `${RACINE}node_modules/@fortawesome/fontawesome-free/svgs/`;

// La liste est lue dans le texte du module, sans l'importer (il importe le fichier généré).
const module = readFileSync(`${RACINE}src/js/icones.js`, 'utf8');
const liste = module.match(/export const ICONES = \[([\s\S]*?)\];/)[1];
const noms = [...liste.matchAll(/'([a-z0-9/-]+)'/g)].map((m) => m[1]);

const traces = {};
const manquantes = [];
for (const nom of noms) {
  const fichier = nom.includes('/') ? `${nom}.svg` : `solid/${nom}.svg`;
  let svg;
  try {
    svg = readFileSync(`${SOURCE}${fichier}`, 'utf8');
  } catch {
    manquantes.push(nom);
    continue;
  }
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const d = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  traces[nom] = { viewBox, d };
}

if (manquantes.length) {
  console.error(`Icônes absentes de Font Awesome Free : ${manquantes.join(', ')}`);
  process.exit(1);
}

const version = JSON.parse(
  readFileSync(`${RACINE}node_modules/@fortawesome/fontawesome-free/package.json`, 'utf8'),
).version;

writeFileSync(
  `${RACINE}src/js/icones-donnees.js`,
  `/* Généré par npm run icones : ne pas modifier à la main.\n` +
    ` * Font Awesome Free ${version}, https://fontawesome.com, licence CC BY 4.0. */\n` +
    `export const TRACES = ${JSON.stringify(traces)};\n`,
);
console.log(`${noms.length} icônes écrites dans src/js/icones-donnees.js`);
