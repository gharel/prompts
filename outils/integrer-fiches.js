/**
 * npm run integrer -- <traduction.json> [autre.json…]
 *
 * Ajoute à src/donnees/fiches.js les fiches traduites (format de outils/consignes-traduction.md).
 * Chaque fiche est reliée à son édition par sa « cle » (slug de l'édition, « slug#2 » pour une
 * 2e section) : la date, l'adresse et le titre viennent de archives/the-neuron/index.json, le
 * titre original de la section vient de l'archive elle-même.
 * Une fiche déjà présente pour la même clé est remplacée (pour corriger une traduction).
 * Les entrées marquées « exclure » sont ignorées. Toute erreur de schéma arrête l'intégration.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extraireCompetences } from './neuron.js';
import { erreursFiche } from '../src/js/schema.js';
import { slugifier } from '../src/js/texte.js';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const SORTIE = `${RACINE}src/donnees/fiches.js`;
const index = JSON.parse(readFileSync(`${RACINE}archives/the-neuron/index.json`, 'utf8'));
const editions = new Map(index.editions.map((e) => [e.slug, e]));

const fichiers = process.argv.slice(2);
if (!fichiers.length) {
  console.error('Usage : npm run integrer -- <traduction.json> [autre.json…]');
  process.exit(1);
}

const { FICHES } = await import('../src/donnees/fiches.js');
const parCle = new Map(FICHES.map((f) => [f.source.cle, f]));
const idsPris = new Set(FICHES.map((f) => f.id));

function idUnique(titre, cle) {
  const existante = parCle.get(cle);
  if (existante) return existante.id;
  const base = slugifier(titre);
  let id = base;
  for (let n = 2; idsPris.has(id); n += 1) id = `${base}-${n}`;
  idsPris.add(id);
  return id;
}

const erreurs = [];
const exclues = [];
let ajoutees = 0;
let remplacees = 0;

for (const fichier of fichiers) {
  const traductions = JSON.parse(readFileSync(fichier, 'utf8'));
  for (const t of traductions) {
    if (t.exclure) {
      exclues.push(t.cle);
      continue;
    }
    const [slug, rang = '1'] = t.cle.split('#');
    const edition = editions.get(slug);
    if (!edition) {
      erreurs.push(`${t.cle} : édition absente des archives (lancez npm run newsletters)`);
      continue;
    }
    const page = readFileSync(`${RACINE}archives/the-neuron/${edition.fichier}`, 'utf8');
    const section = extraireCompetences(page)[Number(rang) - 1];
    const fiche = {
      id: idUnique(t.titre, t.cle),
      titre: t.titre,
      resume: t.resume,
      categorie: t.categorie,
      niveau: t.niveau,
      outils: t.outils,
      corps: t.corps,
      prompts: t.prompts.map((p) => ({
        titre: p.titre,
        type: p.type,
        texte: p.texte,
        adapte: Boolean(p.adapte),
      })),
      aRetenir: t.aRetenir,
      source: {
        cle: t.cle,
        date: edition.date.slice(0, 10),
        url: edition.url,
        newsletter: edition.titre.replace(/^\P{L}+/u, '').trim(),
        rubrique: section?.rubrique ?? 'AI Skill of the Day',
        titreOriginal: section?.titreOriginal || t.titreOriginal || edition.titre,
      },
    };
    erreurs.push(...erreursFiche(fiche));
    if (parCle.has(t.cle)) remplacees += 1;
    else ajoutees += 1;
    parCle.set(t.cle, fiche);
  }
}

if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s), rien n'est écrit :\n  ${erreurs.join('\n  ')}`);
  process.exit(1);
}

const toutes = [...parCle.values()].sort(
  (a, b) => b.source.date.localeCompare(a.source.date) || a.id.localeCompare(b.id),
);
writeFileSync(
  SORTIE,
  `/**
 * Les fiches de la Prompthèque : techniques de la rubrique « AI Skill of the Day » (ancien nom :
 * « Prompt Tip of the Day ») de
 * The Neuron (theneurondaily.com), traduites et adaptées par Skazy Formation.
 * Fichier écrit par npm run integrer (outils/integrer-fiches.js) ; schéma : src/js/schema.js.
 * Chaque fiche garde sa source : date de l'édition, adresse, titre original.
 */
export const FICHES = ${JSON.stringify(toutes, null, 2)};
`,
);
execFileSync(
  process.execPath,
  [`${RACINE}node_modules/prettier/bin/prettier.cjs`, '--write', SORTIE],
  {
    stdio: 'ignore',
  },
);
console.log(
  `${ajoutees} fiche(s) ajoutée(s), ${remplacees} remplacée(s), ${exclues.length} exclue(s)` +
    `${exclues.length ? ` (${exclues.join(', ')})` : ''}. Total : ${toutes.length} fiches.`,
);
