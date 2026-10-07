/**
 * Les résultats : titre et nombre, menus de filtre (niveau, outil, tri) avec le nombre de
 * fiches de chaque choix, filtres actifs, grille de cartes, état vide.
 */
import { el, remplir, pluriel, annoncer } from '../ui.js';
import { icone } from '../icones.js';
import { CATEGORIES, NIVEAUX, OUTILS, categorie } from '../../donnees/referentiels.js';
import { filtrer, trier, TRIS, auHasard, texteRecherche } from '../filtres.js';
import { nombreFiltresActifs } from '../etat.js';
import { creerCarte } from './carte.js';
import { creerMenuFiltre } from './menu.js';

/** Cartes affichées par lot : la page reste légère, même sur téléphone. */
export const PAS_AFFICHAGE = 36;

const CHOIX_NIVEAUX = [{ slug: 'tous', nom: 'Tous les niveaux' }, ...NIVEAUX];
const CHOIX_OUTILS = [
  { slug: 'tous', nom: 'Tous les outils' },
  ...OUTILS.filter((o) => o.slug !== 'tous'),
];

export function monterResultats(conteneur, magasin, fiches) {
  const index = new Map(fiches.map((f) => [f.id, texteRecherche(f)]));
  const cartes = new Map(fiches.map((f) => [f.id, creerCarte(f, magasin)]));
  let courants = [];
  let affichees = PAS_AFFICHAGE;

  const f = magasin.filtres;
  const niveau = creerMenuFiltre({
    id: 'filtre-niveau',
    libelle: 'Niveau',
    nomIcone: 'stairs',
    options: CHOIX_NIVEAUX,
    valeur: f.niveau,
    parDefaut: 'tous',
    surChoix: (slug) => magasin.changerFiltres({ niveau: slug }),
  });
  const outil = creerMenuFiltre({
    id: 'filtre-outil',
    libelle: 'Outil',
    nomIcone: 'toolbox',
    options: CHOIX_OUTILS,
    valeur: f.outil,
    parDefaut: 'tous',
    surChoix: (slug) => magasin.changerFiltres({ outil: slug }),
  });
  const tri = creerMenuFiltre({
    id: 'filtre-tri',
    libelle: 'Trier',
    nomIcone: 'arrow-down-wide-short',
    options: TRIS,
    valeur: f.tri,
    aDroite: true,
    surChoix: (slug) => magasin.changerFiltres({ tri: slug }),
  });

  const hasard = el(
    'button',
    {
      type: 'button',
      class: 'bouton bouton--secondaire bouton--compact',
      id: 'hasard',
      'aria-label': 'Ouvrir une fiche au hasard',
    },
    icone('shuffle'),
    el('span', { class: 'hasard__long' }, 'Une fiche au hasard'),
    el('span', { class: 'hasard__court', 'aria-hidden': 'true' }, 'Au hasard'),
  );
  const titre = el('h2', { id: 'titre-resultats' });
  const contexte = el('p', { class: 'resultats__contexte' });
  const actifs = el('div', { class: 'actifs', 'aria-label': 'Filtres actifs' });
  const grille = el('div', { class: 'grille', id: 'grille' });
  const vide = el('div', { class: 'vide', hidden: true });
  const plus = el('div', { class: 'resultats__plus' });

  remplir(
    conteneur,
    el(
      'div',
      { class: 'resultats__interieur' },
      el(
        'div',
        { class: 'resultats__entete' },
        el('div', { class: 'resultats__titres' }, titre, contexte),
        hasard,
      ),
      el(
        'div',
        { class: 'barre-filtres', role: 'group', 'aria-label': 'Affiner la liste' },
        el('div', { class: 'barre-filtres__groupe' }, niveau.element, outil.element),
        tri.element,
      ),
      actifs,
      grille,
      plus,
      vide,
    ),
  );

  hasard.addEventListener('click', () => {
    const tiree = auHasard(courants.length ? courants : fiches);
    if (tiree) globalThis.location.hash = tiree.id;
  });

  function puceActive(texte, retirer) {
    return el(
      'button',
      {
        type: 'button',
        class: 'actif',
        'aria-label': `Retirer le filtre : ${texte}`,
        onclick: retirer,
      },
      el('span', {}, texte),
      icone('xmark'),
    );
  }

  function afficherActifs() {
    const filtres = magasin.filtres;
    const puces = [];
    if (filtres.recherche.trim()) {
      puces.push(
        puceActive(`« ${filtres.recherche.trim()} »`, () =>
          magasin.changerFiltres({ recherche: '' }),
        ),
      );
    }
    if (filtres.categorie !== 'toutes') {
      puces.push(
        puceActive(categorie(filtres.categorie).nom, () =>
          magasin.changerFiltres({ categorie: 'toutes' }),
        ),
      );
    }
    if (filtres.niveau !== 'tous') {
      puces.push(
        puceActive(NIVEAUX.find((n) => n.slug === filtres.niveau).nom, () =>
          magasin.changerFiltres({ niveau: 'tous' }),
        ),
      );
    }
    if (filtres.outil !== 'tous') {
      puces.push(
        puceActive(OUTILS.find((o) => o.slug === filtres.outil).nom, () =>
          magasin.changerFiltres({ outil: 'tous' }),
        ),
      );
    }
    if (filtres.favoris) {
      puces.push(puceActive('Mes favoris', () => magasin.changerFiltres({ favoris: false })));
    }
    if (puces.length > 1) {
      puces.push(
        el(
          'button',
          {
            type: 'button',
            class: 'bouton bouton--discret',
            onclick: () => magasin.reinitialiser(),
          },
          icone('rotate-left'),
          'Tout effacer',
        ),
      );
    }
    remplir(actifs, puces);
    actifs.hidden = puces.length === 0;
  }

  function afficherVide() {
    const filtres = magasin.filtres;
    const favorisVides = filtres.favoris && magasin.favoris.size === 0;
    remplir(
      vide,
      el('div', { class: 'vide__icone' }, icone(favorisVides ? 'bookmark' : 'magnifying-glass')),
      el(
        'h3',
        {},
        favorisVides ? 'Pas encore de favori' : 'Aucune fiche ne correspond à ces filtres',
      ),
      el(
        'p',
        {},
        favorisVides
          ? 'Touchez le signet d’une fiche pour la retrouver ici. Vos favoris restent dans ce navigateur.'
          : 'Essayez un mot plus court, une autre catégorie, ou effacez les filtres.',
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton bouton--primaire',
          onclick: () => magasin.reinitialiser(),
        },
        icone('rotate-left'),
        favorisVides ? 'Voir toutes les fiches' : 'Effacer les filtres',
      ),
    );
  }

  function libelleContexte(filtres) {
    if (filtres.favoris) return 'Vos favoris, gardés dans ce navigateur.';
    if (filtres.categorie === 'toutes') return 'Toutes les catégories, de toutes les éditions.';
    const cat = categorie(filtres.categorie);
    return `${cat.nom} : ${cat.description.charAt(0).toLowerCase()}${cat.description.slice(1)}`;
  }

  /** Nombre de fiches de chaque choix d'un menu, les autres filtres restant appliqués. */
  function nombresPour(champ, choix) {
    return new Map(
      choix.map((c) => [
        c.slug,
        filtrer(fiches, { ...magasin.filtres, [champ]: c.slug }, magasin.favoris, index).length,
      ]),
    );
  }

  function afficher() {
    const filtres = magasin.filtres;
    courants = trier(filtrer(fiches, filtres, magasin.favoris, index), filtres.tri);
    titre.textContent = courants.length ? pluriel(courants.length, 'fiche') : 'Aucune fiche';
    contexte.textContent = libelleContexte(filtres);
    afficherCartes();
    grille.hidden = courants.length === 0;
    vide.hidden = courants.length > 0;
    if (!courants.length) afficherVide();
    afficherActifs();
    niveau.mettreAJour(filtres.niveau, nombresPour('niveau', CHOIX_NIVEAUX));
    outil.mettreAJour(filtres.outil, nombresPour('outil', CHOIX_OUTILS));
    tri.mettreAJour(filtres.tri);
  }

  /** Les cartes du lot courant, et le bouton pour afficher le lot suivant. */
  function afficherCartes() {
    const visibles = courants.slice(0, affichees);
    grille.replaceChildren(...visibles.map((fiche) => cartes.get(fiche.id)));
    const reste = courants.length - visibles.length;
    if (reste <= 0) {
      plus.replaceChildren();
      return;
    }
    const lot = Math.min(PAS_AFFICHAGE, reste);
    remplir(
      plus,
      el(
        'p',
        { class: 'resultats__compte' },
        `${visibles.length} sur ${courants.length} fiches affichées`,
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton bouton--secondaire',
          id: 'afficher-plus',
          onclick: () => {
            const premiere = visibles.length;
            affichees += PAS_AFFICHAGE;
            afficherCartes();
            // Le focus passe à la première nouvelle carte, pour continuer au clavier.
            grille.children[premiere]
              ?.querySelector('.carte__lien')
              ?.focus({ preventScroll: true });
          },
        },
        icone('plus'),
        `Afficher ${pluriel(lot, 'fiche')} de plus`,
      ),
    );
  }

  let minuterieAnnonce;
  magasin.abonner((raison) => {
    if (raison === 'favoris') {
      for (const carte of cartes.values()) carte.favori.synchroniser();
      if (magasin.filtres.favoris) afficher();
      return;
    }
    affichees = PAS_AFFICHAGE;
    afficher();
    clearTimeout(minuterieAnnonce);
    minuterieAnnonce = setTimeout(() => {
      const n = nombreFiltresActifs(magasin.filtres);
      annoncer(
        courants.length
          ? `${pluriel(courants.length, 'fiche')}${n ? ' avec ces filtres' : ''}`
          : 'Aucune fiche avec ces filtres',
      );
    }, 600);
  });
  afficher();

  return {
    courants: () => courants,
    categories: CATEGORIES,
  };
}
