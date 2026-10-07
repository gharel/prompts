/**
 * Une carte de fiche dans la grille (TrainingCard du design system : barre de couleur en haut).
 * Le titre est un lien vers #id : il ouvre la fiche et reste partageable.
 * Les boutons Copier et Favori passent au-dessus du lien qui couvre la carte.
 */
import { el } from '../ui.js';
import { icone } from '../icones.js';
import { categorie, niveau, outil } from '../../donnees/referentiels.js';
import { formaterDate } from '../texte.js';
import { badgeCategorie, copierAvecMessage } from './commun.js';

export function boutonFavori(fiche, magasin, { classe = 'carte__action', avecTexte = false } = {}) {
  const bouton = el('button', { type: 'button', class: `${classe} bouton-favori` });
  const synchroniser = () => {
    const actif = magasin.favoris.has(fiche.id);
    bouton.setAttribute('aria-pressed', String(actif));
    bouton.setAttribute(
      'aria-label',
      actif ? `Retirer « ${fiche.titre} » des favoris` : `Ajouter « ${fiche.titre} » aux favoris`,
    );
    bouton.title = actif ? 'Retirer des favoris' : 'Ajouter aux favoris';
    bouton.replaceChildren(
      icone(actif ? 'bookmark' : 'regular/bookmark'),
      avecTexte
        ? el('span', { 'aria-hidden': 'true' }, actif ? 'Dans mes favoris' : 'Ajouter aux favoris')
        : '',
    );
  };
  bouton.addEventListener('click', () => {
    magasin.basculerFavori(fiche.id);
  });
  bouton.synchroniser = synchroniser;
  synchroniser();
  return bouton;
}

export function creerCarte(fiche, magasin) {
  const cat = categorie(fiche.categorie);
  const premier = fiche.prompts[0];
  const favori = boutonFavori(fiche, magasin);
  const outilsAffiches = fiche.outils.filter((o) => o !== 'tous');

  const carte = el(
    'article',
    { class: 'carte', 'data-couleur': cat.couleur, 'data-id': fiche.id },
    el('div', { class: 'carte__barre' }),
    el(
      'div',
      { class: 'carte__corps' },
      el(
        'div',
        { class: 'carte__haut' },
        badgeCategorie(fiche.categorie, { petit: true }),
        el('span', { class: 'carte__niveau' }, icone('stairs'), niveau(fiche.niveau).nom),
      ),
      el(
        'h3',
        { class: 'carte__titre' },
        el('a', { class: 'carte__lien', href: `#${fiche.id}` }, fiche.titre),
      ),
      el('p', { class: 'carte__resume' }, fiche.resume),
      el(
        'div',
        { class: 'carte__pied' },
        el(
          'div',
          { class: 'carte__infos' },
          el(
            'span',
            { class: 'carte__date' },
            icone('calendar'),
            el(
              'time',
              { datetime: fiche.source.date },
              formaterDate(fiche.source.date, { court: true }),
            ),
          ),
          el(
            'span',
            { class: 'carte__outils' },
            outilsAffiches.length
              ? outilsAffiches.map((o) => el('span', { class: 'outil-mini' }, outil(o).nom))
              : el('span', { class: 'outil-mini' }, 'Tous les chatbots'),
          ),
        ),
        el(
          'div',
          { class: 'carte__actions' },
          el(
            'button',
            {
              type: 'button',
              class: 'carte__action',
              title: premier.type === 'commande' ? 'Copier la commande' : 'Copier le prompt',
              'aria-label': `Copier le prompt de « ${fiche.titre} »`,
              onclick: () =>
                copierAvecMessage(
                  premier.texte,
                  premier.type === 'commande' ? 'Commande copiée' : 'Prompt copié',
                ),
            },
            icone('copy'),
          ),
          favori,
        ),
      ),
    ),
  );
  carte.favori = favori;
  return carte;
}
