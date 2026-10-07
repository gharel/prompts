/**
 * Menu de filtre : un bouton en pilule qui ouvre une liste de choix (listbox), chacun avec son
 * nombre de fiches. Sur ordinateur, la liste s'ouvre sous le bouton ; sur téléphone, c'est un
 * panneau en bas de l'écran, sur un voile. Clavier : ↑ ↓ Début Fin pour se déplacer,
 * Entrée ou Espace pour choisir, Échap pour fermer.
 */
import { el } from '../ui.js';
import { icone } from '../icones.js';

const menus = new Set();
let voile;

function voileCommun() {
  if (!voile) {
    voile = el('div', { class: 'menu-voile', hidden: true });
    voile.addEventListener('click', () => {
      for (const menu of menus) menu.fermer();
    });
    document.body.append(voile);
  }
  return voile;
}

document.addEventListener('pointerdown', (evenement) => {
  for (const menu of menus) {
    if (menu.ouvert() && !menu.element.contains(evenement.target) && evenement.target !== voile) {
      menu.fermer({ rendreFocus: false });
    }
  }
});

/**
 * options : [{ slug, nom, description? }].
 * parDefaut : la valeur « sans filtre » (le bouton reste neutre) ; null pour un tri.
 * surChoix(slug) est appelé quand l'utilisateur choisit une option.
 */
export function creerMenuFiltre({
  id,
  libelle,
  nomIcone,
  options,
  valeur,
  parDefaut = null,
  aDroite = false,
  surChoix,
}) {
  let actuelle = valeur;
  const texte = el('span', { class: 'menu-filtre__texte' });
  const bouton = el(
    'button',
    {
      type: 'button',
      class: 'menu-filtre__bouton',
      id,
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': `${id}-liste`,
    },
    icone(nomIcone),
    texte,
    icone('chevron-down', { classe: 'menu-filtre__chevron' }),
  );

  const lignes = new Map(
    options.map((o) => {
      const nombre = el('span', { class: 'menu-filtre__nombre' });
      const ligne = el(
        'li',
        {
          role: 'option',
          id: `${id}-${o.slug}`,
          class: 'menu-filtre__option',
          tabindex: '-1',
          'data-valeur': o.slug,
        },
        el('span', { class: 'menu-filtre__coche' }, icone('check')),
        el(
          'span',
          { class: 'menu-filtre__nom' },
          o.nom,
          o.description ? el('small', {}, o.description) : null,
        ),
        nombre,
      );
      ligne.nombre = nombre;
      return [o.slug, ligne];
    }),
  );

  const liste = el(
    'ul',
    {
      role: 'listbox',
      id: `${id}-liste`,
      class: 'menu-filtre__liste',
      'aria-labelledby': `${id}-titre`,
    },
    [...lignes.values()],
  );
  const panneau = el(
    'div',
    { class: 'menu-filtre__panneau', hidden: true },
    el(
      'div',
      { class: 'menu-filtre__entete' },
      el('p', { class: 'menu-filtre__titre', id: `${id}-titre` }, libelle),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton-icone menu-filtre__fermer',
          'aria-label': 'Fermer',
          onclick: () => fermer(),
        },
        icone('xmark'),
      ),
    ),
    liste,
  );
  const element = el(
    'div',
    { class: aDroite ? 'menu-filtre menu-filtre--droite' : 'menu-filtre' },
    bouton,
    panneau,
  );

  const activables = () =>
    [...lignes.values()].filter((l) => l.getAttribute('aria-disabled') !== 'true');

  function ouvrir() {
    for (const autre of menus) if (autre !== api) autre.fermer({ rendreFocus: false });
    panneau.hidden = false;
    bouton.setAttribute('aria-expanded', 'true');
    element.classList.add('menu-filtre--ouvert');
    const v = voileCommun();
    v.hidden = false;
    (lignes.get(actuelle) ?? activables()[0])?.focus();
  }

  function fermer({ rendreFocus = true } = {}) {
    if (panneau.hidden) return;
    panneau.hidden = true;
    bouton.setAttribute('aria-expanded', 'false');
    element.classList.remove('menu-filtre--ouvert');
    if (![...menus].some((m) => m.ouvert())) voileCommun().hidden = true;
    if (rendreFocus) bouton.focus();
  }

  function choisir(ligne) {
    if (!ligne || ligne.getAttribute('aria-disabled') === 'true') return;
    fermer();
    if (ligne.dataset.valeur !== actuelle) surChoix(ligne.dataset.valeur);
  }

  bouton.addEventListener('click', () => (panneau.hidden ? ouvrir() : fermer()));
  bouton.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      ouvrir();
    }
  });
  liste.addEventListener('click', (evenement) =>
    choisir(evenement.target.closest('[role="option"]')),
  );
  panneau.addEventListener('keydown', (evenement) => {
    const lignesActives = activables();
    const i = lignesActives.indexOf(document.activeElement);
    const aller = (j) => lignesActives[(j + lignesActives.length) % lignesActives.length]?.focus();
    switch (evenement.key) {
      case 'ArrowDown':
        aller(i + 1);
        break;
      case 'ArrowUp':
        aller(i - 1);
        break;
      case 'Home':
        aller(0);
        break;
      case 'End':
        aller(-1);
        break;
      case 'Enter':
      case ' ':
        if (i >= 0) choisir(lignesActives[i]);
        break;
      case 'Escape':
        fermer();
        break;
      case 'Tab':
        fermer({ rendreFocus: false });
        return;
      default:
        return;
    }
    evenement.preventDefault();
  });

  /** Valeur choisie et nombre de fiches de chaque option (Map slug → nombre, facultatif). */
  function mettreAJour(nouvelle, nombres = null) {
    actuelle = nouvelle;
    const option = options.find((o) => o.slug === nouvelle);
    const actif = parDefaut !== null && nouvelle !== parDefaut;
    texte.textContent = parDefaut === null || actif ? option.nom : libelle;
    bouton.classList.toggle('menu-filtre__bouton--actif', actif);
    bouton.setAttribute('aria-label', `${libelle} : ${option.nom}`);
    for (const [slug, ligne] of lignes) {
      const choisie = slug === nouvelle;
      ligne.setAttribute('aria-selected', String(choisie));
      const n = nombres?.get(slug);
      ligne.nombre.textContent = n === undefined ? '' : String(n);
      const vide = n === 0 && !choisie;
      if (vide) ligne.setAttribute('aria-disabled', 'true');
      else ligne.removeAttribute('aria-disabled');
    }
  }

  const api = { element, ouvert: () => !panneau.hidden, fermer, mettreAJour };
  menus.add(api);
  mettreAJour(valeur);
  return api;
}
