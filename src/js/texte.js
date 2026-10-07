/**
 * Logique pure sur le texte des fiches : markdown léger, crochets à compléter, dates.
 * Le rendu en éléments de la page est dans vues/commun.js (jamais d'innerHTML).
 */

/**
 * Découpe un texte en markdown léger en morceaux :
 * { type: 'texte' | 'gras' | 'italique' | 'code', texte } et { type: 'lien', texte, url }.
 * Gère **gras**, *italique*, `code` et [texte](https://…). Pas d'imbrication sauf un lien
 * dans du gras ou de l'italique, rendu comme un lien.
 */
export function analyserMarkdown(source) {
  const morceaux = [];
  const motif =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+?)\*\*|\*([^*\s][^*]*?)\*/g;
  let dernier = 0;
  for (const m of String(source ?? '').matchAll(motif)) {
    if (m.index > dernier) morceaux.push({ type: 'texte', texte: source.slice(dernier, m.index) });
    if (m[1] !== undefined) morceaux.push({ type: 'lien', texte: m[1], url: m[2] });
    else if (m[3] !== undefined) morceaux.push({ type: 'code', texte: m[3] });
    else if (m[4] !== undefined) morceaux.push(...enrichir('gras', m[4]));
    else morceaux.push(...enrichir('italique', m[5]));
    dernier = m.index + m[0].length;
  }
  if (dernier < String(source ?? '').length) {
    morceaux.push({ type: 'texte', texte: source.slice(dernier) });
  }
  return morceaux;
}

/** Gras ou italique pouvant contenir un lien : le lien garde son adresse. */
function enrichir(type, texte) {
  const lien = texte.match(/^(.*?)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)(.*)$/);
  if (!lien) return [{ type, texte }];
  return [
    lien[1] && { type, texte: lien[1] },
    { type: 'lien', texte: lien[2], url: lien[3] },
    lien[4] && { type, texte: lien[4] },
  ].filter(Boolean);
}

/** Texte brut, sans les marques du markdown léger (pour un résumé ou une recherche). */
export function texteBrut(source) {
  return analyserMarkdown(source)
    .map((m) => m.texte)
    .join('');
}

/**
 * Découpe un prompt en morceaux { texte, aCompleter } : les passages entre crochets
 * ([votre plan]) sont à compléter par l'utilisateur et seront surlignés.
 * Les crochets vides, les cases à cocher ([ ], [x]) et les crochets de code (tableaux,
 * [[liens]]) ne sont pas surlignés.
 */
export function decouperACompleter(texte) {
  const morceaux = [];
  const motif = /\[(?!\[)([^\]\n]{2,120})\](?!\()/g;
  let dernier = 0;
  for (const m of String(texte).matchAll(motif)) {
    const contenu = m[1];
    if (!/[\p{L}]{2}/u.test(contenu) || /^["'\d\s,.:-]*$/.test(contenu)) continue;
    if (m.index > dernier)
      morceaux.push({ texte: texte.slice(dernier, m.index), aCompleter: false });
    morceaux.push({ texte: m[0], aCompleter: true });
    dernier = m.index + m[0].length;
  }
  if (dernier < texte.length) morceaux.push({ texte: texte.slice(dernier), aCompleter: false });
  return morceaux;
}

/** Nombre de passages à compléter dans un prompt. */
export function nombreACompleter(texte) {
  return decouperACompleter(texte).filter((m) => m.aCompleter).length;
}

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const MOIS_COURTS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** « 2026-10-02 » → « 2 octobre 2026 » (ou « 2 oct. 2026 » en court). */
export function formaterDate(iso, { court = false } = {}) {
  const [annee, mois, jour] = String(iso).split('-').map(Number);
  if (!annee || !mois || !jour) return '';
  const nomMois = (court ? MOIS_COURTS : MOIS)[mois - 1];
  return `${jour === 1 ? '1er' : jour} ${nomMois} ${annee}`;
}

/** Identifiant lisible à partir d'un titre : « Vérifier l’IA » → « verifier-l-ia ». */
export function slugifier(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}
