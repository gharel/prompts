/**
 * Icônes Font Awesome Free (licence CC BY 4.0), dessinées en SVG. La liste ci-dessous est la
 * seule source : `npm run icones` en extrait les tracés dans icones-donnees.js.
 * Les icônes sont décoratives (aria-hidden) : le texte voisin doit suffire.
 */
import { TRACES } from './icones-donnees.js';

export const ICONES = [
  // Catégories
  'pen-nib',
  'shield-halved',
  'robot',
  'code',
  'brain',
  'palette',
  'briefcase',
  'toolbox',
  'layer-group',
  // Interface
  'magnifying-glass',
  'copy',
  'check',
  'xmark',
  'bookmark',
  'regular/bookmark',
  'sun',
  'moon',
  'circle-half-stroke',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-up-right-from-square',
  'link',
  'sliders',
  'chevron-down',
  'plus',
  'arrow-down-wide-short',
  'rotate-left',
  'lightbulb',
  'terminal',
  'file-lines',
  'wand-magic-sparkles',
  'stairs',
  'shuffle',
  'circle-info',
  'newspaper',
  'calendar',
  'quote-left',
  'list-check',
  'graduation-cap',
];

const SVG = 'http://www.w3.org/2000/svg';

/**
 * icone('copy') → <svg class="icone" aria-hidden="true">…</svg>.
 * Une icône inconnue lève une erreur (tests/unit/icones.test.js vérifie les appels).
 */
export function icone(nom, { classe = '' } = {}) {
  const trace = TRACES[nom];
  if (!trace) throw new Error(`Icône inconnue : ${nom}`);
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', trace.viewBox);
  svg.setAttribute('class', classe ? `icone ${classe}` : 'icone');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of trace.d) {
    const chemin = document.createElementNS(SVG, 'path');
    chemin.setAttribute('d', d);
    svg.append(chemin);
  }
  return svg;
}
