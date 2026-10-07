/**
 * npm run newsletters : met à jour les archives de The Neuron, puis liste les sections
 * « AI Skill of the Day » qui n'ont pas encore de fiche.
 *
 *   npm run newsletters                      récupère les éditions absentes des archives
 *   npm run newsletters -- --importer <dir>  archive des pages déjà téléchargées (<slug>.html)
 *   npm run newsletters -- --preparer        ne télécharge rien, prépare seulement la liste
 *
 * Archives : archives/the-neuron/<année>/<date>-<slug>.html (corps complet de l'édition,
 * nettoyé) et archives/the-neuron/index.json (date, titre, adresse source, date de récupération).
 * Sections à traduire : archives/a-traduire.json, au format attendu par
 * outils/consignes-traduction.md ; une fois traduites : npm run integrer -- <fichier.json>.
 *
 * Le site est derrière Cloudflare, qui refuse le client HTTP de Node : on passe par curl
 * (présent sous Windows 10+, macOS et Linux), une page à la fois, avec une pause.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nettoyer, pageArchive, extraireCompetences } from './neuron.js';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const ARCHIVES = `${RACINE}archives/the-neuron/`;
const INDEX = `${ARCHIVES}index.json`;
const A_TRADUIRE = `${RACINE}archives/a-traduire.json`;
const SITE = 'https://www.theneurondaily.com';
const NAVIGATEUR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function lireIndex() {
  if (!existsSync(INDEX)) return { source: SITE, misAJour: null, editions: [] };
  return JSON.parse(readFileSync(INDEX, 'utf8'));
}

function ecrireIndex(index) {
  index.editions.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  index.misAJour = new Date().toISOString();
  writeFileSync(INDEX, `${JSON.stringify(index, null, 2)}\n`);
}

/** Télécharge une adresse avec curl ; renvoie le texte, ou null après plusieurs refus. */
async function telecharger(adresse) {
  for (let essai = 1; essai <= 5; essai += 1) {
    try {
      return execFileSync(
        'curl',
        [
          '-sS',
          '--fail',
          '--connect-timeout',
          '15',
          '--max-time',
          '60',
          '-A',
          NAVIGATEUR,
          '-H',
          'Accept-Language: en-US,en;q=0.9',
          adresse,
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (erreur) {
      console.warn(
        `  ${adresse} : échec ${essai}/5 (${String(erreur.stderr ?? erreur.message).trim()})`,
      );
      await pause(15000 * essai);
    }
  }
  return null;
}

function slugDe(adresse) {
  return adresse.replace(/\/+$/, '').split('/p/')[1];
}

/** Archive une page brute ; renvoie l'entrée d'index, ou null si ce n'est pas une édition. */
function archiver(brut, slug, recupereLe) {
  const url = `${SITE}/p/${slug}`;
  const edition = nettoyer(brut, url);
  if (!edition || !edition.date) return null;
  const annee = edition.date.slice(0, 4);
  const fichier = `${annee}/${edition.date.slice(0, 10)}-${slug}.html`;
  mkdirSync(`${ARCHIVES}${annee}`, { recursive: true });
  writeFileSync(`${ARCHIVES}${fichier}`, pageArchive(edition, recupereLe));
  return {
    slug,
    date: edition.date,
    titre: edition.titre,
    sousTitre: edition.sousTitre,
    url,
    fichier,
    recupereLe,
  };
}

function ajouter(index, entree) {
  const i = index.editions.findIndex((e) => e.slug === entree.slug);
  if (i >= 0) index.editions[i] = entree;
  else index.editions.push(entree);
}

async function recupererNouvelles(index) {
  console.log(`Lecture du plan du site ${SITE}/sitemap.xml…`);
  const plan = await telecharger(`${SITE}/sitemap.xml`);
  if (!plan) throw new Error('Plan du site inaccessible : réessayez plus tard.');
  const connues = new Set(index.editions.map((e) => e.slug));
  const adresses = [
    ...new Set([...plan.matchAll(/<loc>([^<]+\/p\/[^<]+)<\/loc>/g)].map((m) => m[1])),
  ];
  const nouvelles = adresses.filter((a) => !connues.has(slugDe(a)));
  console.log(`${adresses.length} éditions sur le site, ${nouvelles.length} à récupérer.`);
  let n = 0;
  for (const adresse of nouvelles) {
    const brut = await telecharger(adresse);
    if (brut) {
      const entree = archiver(brut, slugDe(adresse), new Date().toISOString());
      if (entree) {
        ajouter(index, entree);
        n += 1;
        console.log(`  + ${entree.date.slice(0, 10)} ${entree.titre}`);
      }
    }
    if (n && n % 20 === 0) ecrireIndex(index);
    await pause(800);
  }
  ecrireIndex(index);
  console.log(`${n} édition(s) ajoutée(s) aux archives.`);
}

function importer(index, dossier) {
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.html'));
  console.log(`Import de ${fichiers.length} pages depuis ${dossier}…`);
  let n = 0;
  for (const nom of fichiers) {
    const brut = readFileSync(`${dossier}/${nom}`, 'utf8');
    // Date de récupération : celle du fichier téléchargé.
    const recupereLe = statSync(`${dossier}/${nom}`).mtime.toISOString();
    const entree = archiver(brut, nom.slice(0, -5), recupereLe);
    if (entree) {
      ajouter(index, entree);
      n += 1;
    } else {
      console.warn(`  ${nom} : pas une édition, ignorée`);
    }
  }
  ecrireIndex(index);
  console.log(`${n} édition(s) archivée(s).`);
}

/**
 * Liste les sections de la rubrique (« AI Skill of the Day », anciennement « Prompt Tip of the
 * Day ») des archives qui n'ont pas encore de fiche.
 */
async function preparer(index) {
  const { FICHES } = await import('../src/donnees/fiches.js');
  const traitees = new Set(FICHES.map((f) => f.source.cle));
  const a = [];
  for (const edition of index.editions) {
    const page = readFileSync(`${ARCHIVES}${edition.fichier}`, 'utf8');
    extraireCompetences(page).forEach((section, rang) => {
      const cle = rang ? `${edition.slug}#${rang + 1}` : edition.slug;
      if (traitees.has(cle)) return;
      a.push({
        cle,
        date: edition.date.slice(0, 10),
        url: edition.url,
        newsletter: edition.titre,
        rubrique: section.rubrique,
        titreOriginal: section.titreOriginal,
        blocs: section.blocs,
      });
    });
  }
  a.sort((x, y) => x.date.localeCompare(y.date));
  writeFileSync(A_TRADUIRE, `${JSON.stringify(a, null, 1)}\n`);
  console.log(
    a.length
      ? `${a.length} section(s) « AI Skill of the Day » sans fiche : archives/a-traduire.json.\n` +
          'Faites-les traduire en suivant outils/consignes-traduction.md, puis : npm run integrer -- <traduction.json>'
      : 'Toutes les sections « AI Skill of the Day » des archives ont leur fiche.',
  );
}

const args = process.argv.slice(2);
const index = lireIndex();
mkdirSync(ARCHIVES, { recursive: true });
if (args[0] === '--importer') importer(index, args[1]);
else if (args[0] !== '--preparer') await recupererNouvelles(index);
await preparer(index);
