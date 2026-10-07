/**
 * La fiche complète, dans un panneau latéral (<dialog>) : la technique, le ou les prompts,
 * l'idée à retenir, la source et des fiches de la même catégorie.
 * Ouverte par l'adresse #id-de-la-fiche ; flèches ← → pour passer à la voisine.
 */
import { el, remplir, focaliser, estChampDeSaisie } from '../ui.js';
import { icone } from '../icones.js';
import { niveau, outil } from '../../donnees/referentiels.js';
import { formaterDate } from '../texte.js';
import { voisines, similaires } from '../filtres.js';
import { markdown, lienExterne, badgeCategorie, blocPrompt, copierAvecMessage } from './commun.js';
import { boutonFavori } from './carte.js';

function corps(blocs) {
  return blocs.map((bloc) => {
    if (bloc.t === 'liste') {
      return el(
        'ul',
        { class: 'fiche__liste' },
        bloc.x.map((x) => el('li', {}, markdown(x))),
      );
    }
    if (bloc.t === 'etapes') {
      return el(
        'ol',
        { class: 'fiche__etapes' },
        bloc.x.map((x) => el('li', {}, markdown(x))),
      );
    }
    return el('p', {}, markdown(bloc.x));
  });
}

function section(titre, nomIcone, ...contenu) {
  return el(
    'section',
    { class: 'fiche__section' },
    el('h3', { class: 'fiche__intertitre' }, icone(nomIcone), titre),
    ...contenu,
  );
}

export function monterFiche(dialogue, magasin, fiches, { courants }) {
  const parId = new Map(fiches.map((f) => [f.id, f]));
  let actuelle = null;
  let liste = [];
  let declencheur = null;

  function fermer() {
    if (dialogue.open) dialogue.close();
  }

  dialogue.addEventListener('close', () => {
    actuelle = null;
    if (globalThis.location.hash) {
      history.replaceState(null, '', globalThis.location.pathname + globalThis.location.search);
    }
    document.documentElement.classList.remove('fiche-ouverte');
    if (declencheur?.isConnected) declencheur.focus({ preventScroll: true });
  });
  // Un clic sur le voile (hors du panneau) ferme la fiche.
  dialogue.addEventListener('click', (evenement) => {
    if (evenement.target === dialogue) fermer();
  });
  dialogue.addEventListener('keydown', (evenement) => {
    if (estChampDeSaisie(evenement.target) || evenement.altKey || evenement.ctrlKey) return;
    if (evenement.metaKey) return;
    const { precedente, suivante } = voisines(liste, actuelle?.id);
    if (evenement.key === 'ArrowLeft' && precedente) aller(precedente.id);
    if (evenement.key === 'ArrowRight' && suivante) aller(suivante.id);
  });

  function aller(id) {
    globalThis.location.hash = id;
  }

  function afficher(fiche) {
    const { precedente, suivante } = voisines(liste, fiche.id);
    const position = liste.findIndex((f) => f.id === fiche.id);
    const premier = fiche.prompts[0];
    const plusieurs = fiche.prompts.length > 1;
    const outils = fiche.outils.filter((o) => o !== 'tous');

    const navigation = el(
      'div',
      { class: 'fiche__navigation' },
      el(
        'button',
        {
          type: 'button',
          class: 'bouton-icone',
          disabled: !precedente,
          'aria-label': precedente
            ? `Fiche précédente : ${precedente.titre}`
            : 'Pas de fiche précédente',
          title: 'Fiche précédente (←)',
          onclick: () => precedente && aller(precedente.id),
        },
        icone('arrow-left'),
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton-icone',
          disabled: !suivante,
          'aria-label': suivante ? `Fiche suivante : ${suivante.titre}` : 'Pas de fiche suivante',
          title: 'Fiche suivante (→)',
          onclick: () => suivante && aller(suivante.id),
        },
        icone('arrow-right'),
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton-icone fiche__fermer',
          'aria-label': 'Fermer la fiche',
          title: 'Fermer (Échap)',
          onclick: fermer,
        },
        icone('xmark'),
      ),
    );

    const voisinesCategorie = similaires(fiches, fiche, 3);

    remplir(
      dialogue,
      el(
        'div',
        { class: 'fiche', 'data-couleur': badgeCategorie(fiche.categorie).dataset.couleur },
        el('div', { class: 'fiche__barre' }),
        el(
          'header',
          { class: 'fiche__entete' },
          el(
            'p',
            { class: 'fiche__position' },
            position >= 0 ? `Fiche ${position + 1} sur ${liste.length}` : 'Fiche',
          ),
          navigation,
        ),
        el(
          'div',
          { class: 'fiche__tete' },
          el(
            'div',
            { class: 'fiche__meta' },
            badgeCategorie(fiche.categorie),
            el('span', { class: 'puce' }, icone('stairs'), niveau(fiche.niveau).nom),
          ),
          el('h2', { id: 'titre-fiche', class: 'fiche__titre' }, fiche.titre),
          el('p', { class: 'fiche__resume' }, fiche.resume),
          el(
            'p',
            { class: 'fiche__infos' },
            el(
              'span',
              {},
              icone('calendar'),
              el('time', { datetime: fiche.source.date }, formaterDate(fiche.source.date)),
            ),
            el(
              'span',
              {},
              icone('toolbox'),
              outils.length ? outils.map((o) => outil(o).nom).join(', ') : 'Tous les chatbots',
            ),
          ),
          el(
            'div',
            { class: 'fiche__actions' },
            el(
              'button',
              {
                type: 'button',
                class: 'bouton bouton--primaire',
                id: 'copier-principal',
                onclick: () =>
                  copierAvecMessage(
                    premier.texte,
                    premier.type === 'commande' ? 'Commande copiée' : 'Prompt copié',
                  ),
              },
              icone('copy'),
              premier.type === 'commande'
                ? 'Copier la commande'
                : plusieurs
                  ? 'Copier le prompt principal'
                  : 'Copier le prompt',
            ),
            boutonFavori(fiche, magasin, {
              classe: 'bouton bouton--secondaire bouton--favori-fiche',
              avecTexte: true,
            }),
            el(
              'button',
              {
                type: 'button',
                class: 'bouton bouton--discret',
                onclick: () =>
                  copierAvecMessage(
                    `${globalThis.location.origin}${globalThis.location.pathname}#${fiche.id}`,
                    'Lien de la fiche copié',
                  ),
              },
              icone('link'),
              'Copier le lien',
            ),
          ),
        ),
        el(
          'div',
          { class: 'fiche__corps' },
          section('La technique', 'lightbulb', ...corps(fiche.corps)),
          section(
            plusieurs ? `Les ${fiche.prompts.length} prompts` : 'Le prompt',
            'quote-left',
            el(
              'div',
              { class: 'fiche__prompts' },
              fiche.prompts.map((p, i) => blocPrompt(p, { numero: plusieurs ? i + 1 : null })),
            ),
          ),
          fiche.aRetenir
            ? el(
                'aside',
                { class: 'a-retenir' },
                el('p', { class: 'a-retenir__titre' }, icone('graduation-cap'), 'À retenir'),
                el('p', {}, markdown(fiche.aRetenir)),
              )
            : null,
          el(
            'section',
            { class: 'fiche__source' },
            el('h3', { class: 'fiche__intertitre' }, icone('newspaper'), 'Source'),
            el(
              'p',
              {},
              `Traduit et adapté de la rubrique « ${fiche.source.rubrique} » de la newsletter The Neuron, édition du `,
              formaterDate(fiche.source.date),
              fiche.source.rubrique === 'AI Skill of the Day'
                ? ''
                : ' (ancien nom de la rubrique « AI Skill of the Day »)',
              ' : ',
              el('cite', { lang: 'en' }, fiche.source.titreOriginal || fiche.source.newsletter),
              '.',
            ),
            lienExterne('Lire l’article original (en anglais)', fiche.source.url),
          ),
          voisinesCategorie.length
            ? el(
                'nav',
                { class: 'fiche__similaires', 'aria-labelledby': 'titre-similaires' },
                el(
                  'h3',
                  { class: 'fiche__intertitre', id: 'titre-similaires' },
                  icone('layer-group'),
                  'Dans la même catégorie',
                ),
                el(
                  'ul',
                  {},
                  voisinesCategorie.map((v) =>
                    el(
                      'li',
                      {},
                      el(
                        'a',
                        { href: `#${v.id}`, class: 'similaire' },
                        el('span', { class: 'similaire__titre' }, v.titre),
                        el('span', { class: 'similaire__resume' }, v.resume),
                      ),
                    ),
                  ),
                ),
              )
            : null,
        ),
      ),
    );
  }

  function ouvrir(id) {
    const fiche = parId.get(id);
    if (!fiche) return false;
    liste = courants();
    if (!liste.some((f) => f.id === id)) liste = fiches;
    if (!dialogue.open) declencheur = document.activeElement;
    actuelle = fiche;
    afficher(fiche);
    if (!dialogue.open) {
      dialogue.showModal();
      document.documentElement.classList.add('fiche-ouverte');
    }
    dialogue.scrollTop = 0;
    focaliser(dialogue.querySelector('#titre-fiche'));
    document.title = `${fiche.titre} · Prompthèque`;
    return true;
  }

  dialogue.addEventListener('close', () => {
    document.title = 'Prompthèque · Skazy Formation';
  });

  magasin.abonner((raison) => {
    if (raison === 'favoris' && actuelle) {
      dialogue.querySelector('.bouton--favori-fiche')?.synchroniser?.();
    }
  });

  return { ouvrir, fermer, estOuverte: () => dialogue.open };
}
