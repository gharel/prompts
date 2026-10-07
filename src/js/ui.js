/**
 * Petits outils d'affichage, repris de jeu-formation. Tout texte passe par textContent :
 * jamais d'innerHTML avec du contenu.
 */

const ESPACE_INSECABLE = '\u00a0';

/**
 * Typographie française : espace insécable avant ! ? ; : » et après «, pour qu'un retour
 * à la ligne ne laisse jamais la ponctuation seule en début de ligne.
 * - Une espace ordinaire (ou fine) devant la ponctuation devient insécable.
 * - Une espace qui manque est ajoutée (« Prêts? » → « Prêts ? »), seulement en fin de mot :
 *   la ponctuation doit être suivie d'une espace ou finir le texte. Une adresse ou une heure
 *   (https://, page?id=2, 10:30) reste intacte.
 * L'espace fine (U+202F) n'est pas utilisée : trop étroite dans la police Georama.
 */
export function typographier(texte) {
  return String(texte)
    .replace(/[ \u202f]+([!?;:»])/g, `${ESPACE_INSECABLE}$1`)
    .replace(/([\p{L}\p{N}.…»])([!?;:]+)(?=[\s)»]|$)/gu, `$1${ESPACE_INSECABLE}$2`)
    .replace(/«[ \u202f]*(?=[^\s\u00a0])/g, `«${ESPACE_INSECABLE}`)
    .replace(/([^\s\u00a0«])»/g, `$1${ESPACE_INSECABLE}»`);
}

/** Attributs dont le texte s'affiche (placeholder, info-bulle) ou se lit : même typographie. */
const ATTRIBUTS_TEXTE = new Set(['placeholder', 'title', 'aria-label']);

function ajouterEnfants(noeud, enfants) {
  for (const enfant of enfants.flat(Infinity)) {
    if (enfant === null || enfant === undefined || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : document.createTextNode(typographier(enfant)));
  }
}

/**
 * Crée un élément : el('button', { class: 'bouton', onclick: fn, 'aria-label': '…' }, 'Texte').
 * Les attributs à false/null/undefined sont ignorés, true donne un attribut vide.
 */
export function el(balise, attributs = {}, ...enfants) {
  const noeud = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs ?? {})) {
    if (valeur === null || valeur === undefined || valeur === false) continue;
    if (cle === 'class') noeud.className = valeur;
    else if (cle === 'dataset') Object.assign(noeud.dataset, valeur);
    else if (cle.startsWith('on') && typeof valeur === 'function') {
      noeud.addEventListener(cle.slice(2), valeur);
    } else if (cle === 'value') noeud.value = valeur;
    else if (cle === 'checked') noeud.checked = Boolean(valeur);
    else if (valeur === true) noeud.setAttribute(cle, '');
    else if (ATTRIBUTS_TEXTE.has(cle)) noeud.setAttribute(cle, typographier(valeur));
    else noeud.setAttribute(cle, String(valeur));
  }
  ajouterEnfants(noeud, enfants);
  return noeud;
}

/** Remplace tout le contenu d'un nœud. */
export function remplir(noeud, ...enfants) {
  noeud.replaceChildren();
  ajouterEnfants(noeud, enfants);
  return noeud;
}

/** Message lu par les lecteurs d'écran. */
export function annoncer(texte) {
  const zone = document.getElementById('annonces');
  if (!zone) return;
  zone.textContent = '';
  setTimeout(() => {
    zone.textContent = typographier(texte);
  }, 30);
}

const TYPES_NON_TEXTE = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'range',
  'file',
]);

export function estChampDeSaisie(cible) {
  if (!(cible instanceof Element)) return false;
  if (cible.isContentEditable) return true;
  if (cible.tagName === 'TEXTAREA' || cible.tagName === 'SELECT') return true;
  return cible.tagName === 'INPUT' && !TYPES_NON_TEXTE.has(cible.type);
}

/** Met le focus sur un élément (un titre reçoit tabindex=-1 pour pouvoir le prendre). */
export function focaliser(noeud) {
  if (!noeud) return;
  if (!noeud.matches('a[href], button, input, select, textarea, [tabindex]')) {
    noeud.setAttribute('tabindex', '-1');
  }
  noeud.focus({ preventScroll: false });
}

/**
 * Copie un texte dans le presse-papiers. Renvoie true si c'est fait. Repli : sélection d'une
 * zone de texte cachée et document.execCommand('copy') (fichier ouvert en file://, vieux
 * navigateurs).
 */
export async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    const zone = el('textarea', { class: 'hors-ecran', 'aria-hidden': 'true', readonly: true });
    zone.value = texte;
    document.body.append(zone);
    zone.select();
    let ok;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    zone.remove();
    return ok;
  }
}

/** Pluriel simple : pluriel(3, 'exercice') → « 3 exercices ». */
export function pluriel(nombre, singulier, plurielForme = `${singulier}s`) {
  return `${nombre.toLocaleString('fr-FR')} ${nombre > 1 ? plurielForme : singulier}`;
}
