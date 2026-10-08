/**
 * Morceaux d'affichage partagés : markdown léger, badges, lien externe, bloc de prompt, toast.
 */
import { el, copier, annoncer } from '../ui.js';
import { icone } from '../icones.js';
import { analyserMarkdown, decouperACompleter, nombreACompleter } from '../texte.js';
import { categorie as trouverCategorie, TYPES_PROMPT } from '../../donnees/referentiels.js';

/**
 * Mention de droits du pied de page. Le signe copyright est écrit © : Unicode le classe
 * parmi les pictogrammes, et le contrôle « aucun emoji » le refuserait.
 */
export const DROITS = '© 2026 Skazy Formation';
export const USAGE_RESERVE =
  'Usage réservé aux stagiaires de Skazy Formation : reproduction et réutilisation dans une autre formation interdites sans accord écrit.';

/** Markdown léger → nœuds (texte, <strong>, <em>, <code>, <a>). */
export function markdown(source) {
  return analyserMarkdown(source).map((m) => {
    if (m.type === 'gras') return el('strong', {}, m.texte);
    if (m.type === 'italique') return el('em', {}, m.texte);
    if (m.type === 'code') {
      const code = el('code');
      code.textContent = m.texte;
      return code;
    }
    if (m.type === 'lien') return lienExterne(m.texte, m.url, { classe: 'lien-texte' });
    return m.texte;
  });
}

/**
 * Lien vers un autre site, ouvert dans un nouvel onglet. L'icône est collée au dernier mot
 * pour ne jamais se retrouver seule en début de ligne.
 */
export function lienExterne(texte, url, { classe = 'lien-externe' } = {}) {
  const mots = String(texte).trim().split(/\s+/);
  const dernier = mots.pop();
  return el(
    'a',
    { class: classe, href: url, target: '_blank', rel: 'noopener noreferrer' },
    mots.length ? `${mots.join(' ')} ` : '',
    el('span', { class: 'lien-externe__fin' }, dernier, icone('arrow-up-right-from-square')),
    el('span', { class: 'hors-ecran' }, ' (nouvel onglet)'),
  );
}

export function badgeCategorie(slug, { petit = false } = {}) {
  const cat = trouverCategorie(slug);
  return el(
    'span',
    { class: petit ? 'badge badge--sm' : 'badge', 'data-couleur': cat.couleur },
    icone(cat.icone),
    cat.nom,
  );
}

let minuteurToast;

/** Message bref en bas de l'écran, aussi lu par les lecteurs d'écran. */
export function toast(message, nomIcone = 'check') {
  const zone = document.getElementById('toast');
  if (!zone) return;
  zone.replaceChildren(el('span', {}, icone(nomIcone), message));
  zone.classList.add('toast--visible');
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => zone.classList.remove('toast--visible'), 2400);
}

/** Copie un texte et le dit (toast + annonce). */
export async function copierAvecMessage(texte, message = 'Prompt copié') {
  const ok = await copier(texte);
  if (ok) {
    toast(message);
    annoncer(message);
  } else {
    toast('Copie impossible : sélectionnez le texte à la main', 'circle-info');
  }
  return ok;
}

/** Texte d'un prompt, avec les passages [à compléter] surlignés. */
export function textePrompt(texte) {
  const pre = el('pre', { class: 'prompt__texte', tabindex: '0' });
  const code = el('code');
  for (const morceau of decouperACompleter(texte)) {
    if (morceau.aCompleter) {
      const marque = el('mark', { class: 'a-completer' });
      marque.textContent = morceau.texte;
      code.append(marque);
    } else {
      code.append(document.createTextNode(morceau.texte));
    }
  }
  pre.append(code);
  return pre;
}

/** Bloc complet d'un prompt dans la fiche : en-tête, texte, bouton Copier. */
export function blocPrompt(prompt, { numero = null } = {}) {
  const aCompleter = prompt.type === 'prompt' ? nombreACompleter(prompt.texte) : 0;
  const type = TYPES_PROMPT[prompt.type] ?? 'Prompt';
  const libelleCopie =
    prompt.type === 'commande' ? 'Copier la commande' : `Copier le ${type.toLowerCase()}`;
  const nomIcone = { prompt: 'quote-left', commande: 'terminal', fichier: 'file-lines' }[
    prompt.type
  ];

  return el(
    'article',
    { class: 'prompt', 'data-type': prompt.type },
    el(
      'header',
      { class: 'prompt__entete' },
      el(
        'div',
        { class: 'prompt__titres' },
        el(
          'p',
          { class: 'prompt__type' },
          icone(nomIcone ?? 'quote-left'),
          numero ? `${type} ${numero}` : type,
        ),
        el('h4', { class: 'prompt__titre' }, prompt.titre),
      ),
      el(
        'button',
        {
          class: 'bouton bouton--secondaire bouton--compact prompt__copier',
          type: 'button',
          onclick: () =>
            copierAvecMessage(
              prompt.texte,
              prompt.type === 'commande' ? 'Commande copiée' : `${type} copié`,
            ),
        },
        icone('copy'),
        el('span', {}, 'Copier'),
        el('span', { class: 'hors-ecran' }, ` : ${libelleCopie.replace('Copier ', '')}`),
      ),
    ),
    textePrompt(prompt.texte),
    aCompleter || prompt.adapte
      ? el(
          'footer',
          { class: 'prompt__pied' },
          aCompleter
            ? el(
                'p',
                { class: 'prompt__note' },
                el('mark', { class: 'a-completer' }, '[ ]'),
                aCompleter > 1
                  ? `${aCompleter} passages entre crochets à remplacer avant d’envoyer.`
                  : 'Un passage entre crochets à remplacer avant d’envoyer.',
              )
            : null,
          prompt.adapte
            ? el(
                'p',
                { class: 'prompt__note' },
                icone('wand-magic-sparkles'),
                'Prompt rédigé par Skazy Formation pour appliquer la technique : l’article original n’en donnait pas.',
              )
            : null,
        )
      : null,
  );
}
