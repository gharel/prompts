/**
 * Logique pure : rechercher, filtrer, trier et compter les fiches. Aucun accès à la page.
 * Une fiche : voir le schéma en tête de src/donnees/fiches.js.
 */

/** Minuscules sans accents ni ponctuation superflue : « Vérifier l’IA » → « verifier l'ia ». */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLowerCase();
}

/** Texte dans lequel on cherche, calculé une fois par fiche. */
export function texteRecherche(fiche) {
  const morceaux = [
    fiche.titre,
    fiche.titre,
    fiche.resume,
    fiche.aRetenir,
    fiche.source?.titreOriginal,
    ...(fiche.corps ?? []).flatMap((b) => (Array.isArray(b.x) ? b.x : [b.x])),
    ...(fiche.prompts ?? []).flatMap((p) => [p.titre, p.texte]),
  ];
  return normaliser(morceaux.filter(Boolean).join(' \n '));
}

/** Découpe une recherche en mots (deux lettres au moins), sans accents. */
export function motsRecherche(recherche) {
  return normaliser(recherche)
    .split(/[^a-z0-9'+#.-]+/)
    .map((m) => m.replace(/^['.-]+|['.-]+$/g, ''))
    .filter((m) => m.length >= 2);
}

/** Une fiche correspond si chaque mot de la recherche apparaît dans son texte. */
export function correspond(fiche, mots, index = texteRecherche(fiche)) {
  return mots.every((mot) => index.includes(mot));
}

/**
 * Filtre les fiches. filtres = { recherche, categorie, niveau, outil, favoris (booléen) },
 * favorisIds = Set des identifiants en favori. Une valeur vide ou « tous » ne filtre pas.
 */
export function filtrer(fiches, filtres = {}, favorisIds = new Set(), index = null) {
  const mots = motsRecherche(filtres.recherche ?? '');
  return fiches.filter((fiche) => {
    if (filtres.categorie && filtres.categorie !== 'toutes') {
      if (fiche.categorie !== filtres.categorie) return false;
    }
    if (filtres.niveau && filtres.niveau !== 'tous' && fiche.niveau !== filtres.niveau) {
      return false;
    }
    if (filtres.outil && filtres.outil !== 'tous' && !marcheAvec(fiche, filtres.outil)) {
      return false;
    }
    if (filtres.favoris && !favorisIds.has(fiche.id)) return false;
    if (mots.length) {
      const texte = index?.get(fiche.id) ?? texteRecherche(fiche);
      if (!correspond(fiche, mots, texte)) return false;
    }
    return true;
  });
}

export const TRIS = [
  { slug: 'recent', nom: 'Plus récentes' },
  { slug: 'ancien', nom: 'Plus anciennes' },
  { slug: 'alpha', nom: 'De A à Z' },
];

/** Outils de discussion : une technique valable « dans tous les chatbots » vaut pour eux. */
const CHATBOTS = new Set(['chatgpt', 'claude', 'gemini', 'copilot']);

/** La fiche se fait-elle avec cet outil ? */
export function marcheAvec(fiche, outil) {
  return fiche.outils.includes(outil) || (CHATBOTS.has(outil) && fiche.outils.includes('tous'));
}

const comparateurAlpha = new Intl.Collator('fr', { sensitivity: 'base' });

/** Renvoie une nouvelle liste triée. */
export function trier(fiches, tri = 'recent') {
  const copie = [...fiches];
  if (tri === 'alpha') return copie.sort((a, b) => comparateurAlpha.compare(a.titre, b.titre));
  const sens = tri === 'ancien' ? 1 : -1;
  return copie.sort(
    (a, b) =>
      sens * a.source.date.localeCompare(b.source.date) || comparateurAlpha.compare(a.id, b.id),
  );
}

/** Compte les fiches par valeur d'un champ : compter(fiches, 'categorie') → Map slug → nombre. */
export function compter(fiches, champ) {
  const total = new Map();
  for (const fiche of fiches) {
    const valeurs = Array.isArray(fiche[champ]) ? fiche[champ] : [fiche[champ]];
    for (const v of valeurs) total.set(v, (total.get(v) ?? 0) + 1);
  }
  return total;
}

/** Une fiche au hasard parmi la liste (aleatoire : fonction qui renvoie un nombre dans [0, 1[). */
export function auHasard(fiches, aleatoire = Math.random) {
  if (!fiches.length) return null;
  return fiches[Math.floor(aleatoire() * fiches.length)];
}

/** Fiches voisines dans une liste : pour les flèches « précédente » et « suivante ». */
export function voisines(liste, id) {
  const i = liste.findIndex((f) => f.id === id);
  if (i < 0) return { precedente: null, suivante: null };
  return { precedente: liste[i - 1] ?? null, suivante: liste[i + 1] ?? null };
}

/** Fiches de la même catégorie, les plus proches en date, sans la fiche elle-même. */
export function similaires(fiches, fiche, nombre = 3) {
  const temps = (f) => Date.parse(f.source.date);
  return fiches
    .filter((f) => f.id !== fiche.id && f.categorie === fiche.categorie)
    .sort((a, b) => Math.abs(temps(a) - temps(fiche)) - Math.abs(temps(b) - temps(fiche)))
    .slice(0, nombre);
}
