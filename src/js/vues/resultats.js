/**
 * Les résultats : titre et nombre, filtres secondaires (niveau, outil, tri), filtres actifs,
 * grille de cartes, état vide.
 */
import { el, remplir, pluriel, annoncer } from '../ui.js';
import { icone } from '../icones.js';
import { CATEGORIES, NIVEAUX, OUTILS, categorie } from '../../donnees/referentiels.js';
import { filtrer, trier, TRIS, auHasard, texteRecherche } from '../filtres.js';
import { nombreFiltresActifs } from '../etat.js';
import { creerCarte } from './carte.js';

function selecteur(id, libelle, nomIcone, options, valeur) {
  const select = el(
    'select',
    { id, class: 'champ champ--select' },
    options.map((o) => el('option', { value: o.slug, selected: o.slug === valeur }, o.nom)),
  );
  return {
    select,
    bloc: el(
      'label',
      { class: 'filtre', for: id },
      el('span', { class: 'filtre__libelle' }, icone(nomIcone), libelle),
      select,
    ),
  };
}

export function monterResultats(conteneur, magasin, fiches) {
  const index = new Map(fiches.map((f) => [f.id, texteRecherche(f)]));
  const cartes = new Map(fiches.map((f) => [f.id, creerCarte(f, magasin)]));
  let courants = [];

  const f = magasin.filtres;
  const niveau = selecteur(
    'filtre-niveau',
    'Niveau',
    'stairs',
    [{ slug: 'tous', nom: 'Tous' }, ...NIVEAUX],
    f.niveau,
  );
  const outil = selecteur(
    'filtre-outil',
    'Outil',
    'toolbox',
    [{ slug: 'tous', nom: 'Tous' }, ...OUTILS.filter((o) => o.slug !== 'tous')],
    f.outil,
  );
  const tri = selecteur('filtre-tri', 'Trier', 'sliders', TRIS, f.tri);

  const hasard = el(
    'button',
    { type: 'button', class: 'bouton bouton--secondaire', id: 'hasard' },
    icone('shuffle'),
    'Une fiche au hasard',
  );
  const titre = el('h2', { id: 'titre-resultats' });
  const contexte = el('p', { class: 'resultats__contexte' });
  const actifs = el('div', { class: 'actifs', 'aria-label': 'Filtres actifs' });
  const grille = el('div', { class: 'grille', id: 'grille' });
  const vide = el('div', { class: 'vide', hidden: true });

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
      el('div', { class: 'filtres' }, niveau.bloc, outil.bloc, tri.bloc),
      actifs,
      grille,
      vide,
    ),
  );

  niveau.select.addEventListener('change', () =>
    magasin.changerFiltres({ niveau: niveau.select.value }),
  );
  outil.select.addEventListener('change', () =>
    magasin.changerFiltres({ outil: outil.select.value }),
  );
  tri.select.addEventListener('change', () => magasin.changerFiltres({ tri: tri.select.value }));
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
    const morceaux = [
      filtres.categorie === 'toutes' ? 'Toutes catégories' : categorie(filtres.categorie).nom,
      filtres.niveau === 'tous'
        ? 'tous niveaux'
        : NIVEAUX.find((n) => n.slug === filtres.niveau).nom.toLowerCase(),
      filtres.outil === 'tous' ? 'tous outils' : OUTILS.find((o) => o.slug === filtres.outil).nom,
    ];
    return `${morceaux.join(' · ')} · ${TRIS.find((t) => t.slug === filtres.tri).nom.toLowerCase()}`;
  }

  function afficher() {
    const filtres = magasin.filtres;
    courants = trier(filtrer(fiches, filtres, magasin.favoris, index), filtres.tri);
    titre.textContent = courants.length ? pluriel(courants.length, 'fiche') : 'Aucune fiche';
    contexte.textContent = libelleContexte(filtres);
    grille.replaceChildren(...courants.map((fiche) => cartes.get(fiche.id)));
    grille.hidden = courants.length === 0;
    vide.hidden = courants.length > 0;
    if (!courants.length) afficherVide();
    afficherActifs();
    niveau.select.value = filtres.niveau;
    outil.select.value = filtres.outil;
    tri.select.value = filtres.tri;
  }

  let minuterieAnnonce;
  magasin.abonner((raison) => {
    if (raison === 'favoris') {
      for (const carte of cartes.values()) carte.favori.synchroniser();
      if (magasin.filtres.favoris) afficher();
      return;
    }
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
