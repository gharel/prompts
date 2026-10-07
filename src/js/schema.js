/**
 * Schéma d'une fiche et contrôle de typographie. Sert aux tests (toutes les fiches) et à
 * outils/integrer-fiches.js (chaque nouvelle traduction).
 *
 * Une fiche :
 * {
 *   id: 'faire-contredire-l-ia',            // unique, lettres minuscules, chiffres, tirets
 *   titre: 'Faire contredire l’IA…',        // commence par un verbe à l'infinitif, ≤ 90 car.
 *   resume: '…',                            // 1 ou 2 phrases, affichées sur la carte
 *   categorie: 'verifier',                  // slug de CATEGORIES (referentiels.js)
 *   niveau: 'debutant',                     // slug de NIVEAUX
 *   outils: ['tous'],                       // slugs d'OUTILS
 *   corps: [{ t: 'p' | 'liste' | 'etapes', x: '…' | ['…'] }],   // markdown léger
 *   prompts: [{ titre, type: 'prompt' | 'commande' | 'fichier', texte, adapte }],
 *   aRetenir: '…',
 *   source: {
 *     cle: 'slug-de-l-edition',             // « slug#2 » pour la 2e section d'une édition
 *     date: 'AAAA-MM-JJ',                   // date de publication de l'édition
 *     url: 'https://www.theneurondaily.com/p/…',
 *     newsletter: 'Titre de l’édition',
 *     rubrique: 'AI Skill of the Day',      // ou son ancien nom : 'Prompt Tip of the Day'…
 *     titreOriginal: 'Titre anglais de la section',
 *   },
 * }
 */
import { CATEGORIES, NIVEAUX, OUTILS, TYPES_PROMPT } from '../donnees/referentiels.js';

const SLUGS_CATEGORIES = new Set(CATEGORIES.map((c) => c.slug));
const SLUGS_NIVEAUX = new Set(NIVEAUX.map((n) => n.slug));
const SLUGS_OUTILS = new Set(OUTILS.map((o) => o.slug));
const TYPES_BLOC = new Set(['p', 'liste', 'etapes']);
export const RUBRIQUES = new Set([
  'AI Skill of the Day',
  'Prompt Tip of the Day',
  'Prompt Tip of the Week',
]);

const EMOJI = /\p{Extended_Pictographic}/u;

/** Défauts de typographie française d'un texte (hors `code`) : liste de messages. */
export function defautsTypographie(texte) {
  const sansCode = String(texte)
    .replace(/`[^`]*`/g, '')
    .replace(/\]\([^)]*\)/g, ']');
  const defauts = [];
  if (sansCode.includes("'")) defauts.push('apostrophe droite (’ attendue)');
  if (/["“”]/.test(sansCode)) defauts.push('guillemets anglais (« » attendus)');
  if (EMOJI.test(texte)) defauts.push('emoji');
  if (/\.\.\./.test(sansCode)) defauts.push('trois points (… attendu)');
  return defauts;
}

const texteNonVide = (v) => typeof v === 'string' && v.trim().length > 0;

/** Erreurs de schéma et de typographie d'une fiche ; tableau vide si elle est correcte. */
export function erreursFiche(fiche) {
  const erreurs = [];
  const ajouter = (champ, message) => erreurs.push(`${fiche?.id ?? '?'} · ${champ} : ${message}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fiche?.id ?? '')) ajouter('id', 'slug invalide');
  for (const champ of ['titre', 'resume', 'aRetenir']) {
    if (!texteNonVide(fiche[champ])) ajouter(champ, 'manquant');
    else for (const d of defautsTypographie(fiche[champ])) ajouter(champ, d);
  }
  if (texteNonVide(fiche.titre) && fiche.titre.length > 90)
    ajouter('titre', 'plus de 90 caractères');
  if (texteNonVide(fiche.resume) && fiche.resume.length > 280) {
    ajouter('resume', 'plus de 280 caractères');
  }
  if (!SLUGS_CATEGORIES.has(fiche.categorie)) ajouter('categorie', `inconnue (${fiche.categorie})`);
  if (!SLUGS_NIVEAUX.has(fiche.niveau)) ajouter('niveau', `inconnu (${fiche.niveau})`);
  if (!Array.isArray(fiche.outils) || !fiche.outils.length) ajouter('outils', 'liste vide');
  else {
    for (const o of fiche.outils) if (!SLUGS_OUTILS.has(o)) ajouter('outils', `inconnu (${o})`);
    if (fiche.outils.includes('tous') && fiche.outils.length > 1) {
      ajouter('outils', '« tous » doit être seul');
    }
  }

  if (!Array.isArray(fiche.corps) || !fiche.corps.length) ajouter('corps', 'vide');
  else {
    fiche.corps.forEach((bloc, i) => {
      if (!TYPES_BLOC.has(bloc.t)) ajouter(`corps[${i}]`, `type inconnu (${bloc.t})`);
      const textes = Array.isArray(bloc.x) ? bloc.x : [bloc.x];
      if (!textes.length || !textes.every(texteNonVide)) ajouter(`corps[${i}]`, 'texte vide');
      for (const t of textes) for (const d of defautsTypographie(t)) ajouter(`corps[${i}]`, d);
      if (bloc.t === 'p' && Array.isArray(bloc.x))
        ajouter(`corps[${i}]`, 'un paragraphe est un texte');
      if (bloc.t !== 'p' && !Array.isArray(bloc.x))
        ajouter(`corps[${i}]`, 'une liste est un tableau');
    });
  }

  if (!Array.isArray(fiche.prompts) || !fiche.prompts.length) ajouter('prompts', 'aucun prompt');
  else {
    fiche.prompts.forEach((p, i) => {
      if (!texteNonVide(p.titre)) ajouter(`prompts[${i}].titre`, 'manquant');
      else for (const d of defautsTypographie(p.titre)) ajouter(`prompts[${i}].titre`, d);
      if (!(p.type in TYPES_PROMPT)) ajouter(`prompts[${i}].type`, `inconnu (${p.type})`);
      if (!texteNonVide(p.texte)) ajouter(`prompts[${i}].texte`, 'vide');
      if (EMOJI.test(p.texte ?? '')) ajouter(`prompts[${i}].texte`, 'emoji');
      if (typeof p.adapte !== 'boolean') ajouter(`prompts[${i}].adapte`, 'booléen attendu');
    });
  }

  const s = fiche.source ?? {};
  if (!texteNonVide(s.cle)) ajouter('source.cle', 'manquante');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date ?? ''))
    ajouter('source.date', 'format AAAA-MM-JJ attendu');
  if (!/^https:\/\/www\.theneurondaily\.com\/p\/[a-z0-9-]+$/.test(s.url ?? '')) {
    ajouter('source.url', 'adresse de The Neuron attendue');
  }
  if (!texteNonVide(s.titreOriginal)) ajouter('source.titreOriginal', 'manquant');
  if (!texteNonVide(s.newsletter)) ajouter('source.newsletter', 'manquante');
  if (!RUBRIQUES.has(s.rubrique)) ajouter('source.rubrique', `inconnue (${s.rubrique})`);
  return erreurs;
}
