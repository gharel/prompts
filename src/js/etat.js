/**
 * État de la page : filtres, tri, fiche ouverte et favoris.
 * Les filtres et la fiche ouverte sont dans l'adresse (?categorie=verifier#fiche-id) pour qu'un
 * lien partagé ouvre la même vue ; les favoris et le thème restent dans ce navigateur.
 */
import { lire, ecrire } from './stockage.js';

export const FILTRES_PAR_DEFAUT = Object.freeze({
  recherche: '',
  categorie: 'toutes',
  niveau: 'tous',
  outil: 'tous',
  favoris: false,
  tri: 'recent',
});

/** Paramètres d'adresse ↔ filtres (logique pure, testée). */
const PARAMETRES = {
  recherche: 'q',
  categorie: 'categorie',
  niveau: 'niveau',
  outil: 'outil',
  tri: 'tri',
};

export function filtresDepuisAdresse(recherche, valeursPermises = {}) {
  const parametres = new URLSearchParams(recherche);
  const filtres = { ...FILTRES_PAR_DEFAUT };
  for (const [cle, nom] of Object.entries(PARAMETRES)) {
    const valeur = parametres.get(nom);
    if (valeur === null) continue;
    if (cle === 'recherche') filtres.recherche = valeur.slice(0, 120);
    else if (!valeursPermises[cle] || valeursPermises[cle].includes(valeur)) filtres[cle] = valeur;
  }
  filtres.favoris = parametres.get('favoris') === '1';
  return filtres;
}

export function adresseDepuisFiltres(filtres) {
  const parametres = new URLSearchParams();
  for (const [cle, nom] of Object.entries(PARAMETRES)) {
    const valeur = filtres[cle];
    if (valeur && valeur !== FILTRES_PAR_DEFAUT[cle])
      parametres.set(nom, valeur.trim?.() ?? valeur);
  }
  if (filtres.favoris) parametres.set('favoris', '1');
  const texte = parametres.toString();
  return texte ? `?${texte}` : '';
}

/** Nombre de filtres actifs (hors tri), pour le bouton « Effacer les filtres ». */
export function nombreFiltresActifs(filtres) {
  let n = 0;
  if (filtres.recherche.trim()) n += 1;
  if (filtres.categorie !== 'toutes') n += 1;
  if (filtres.niveau !== 'tous') n += 1;
  if (filtres.outil !== 'tous') n += 1;
  if (filtres.favoris) n += 1;
  return n;
}

/** Le magasin : un état et des abonnés prévenus à chaque changement. */
export function creerEtat(filtresInitiaux = FILTRES_PAR_DEFAUT) {
  let filtres = { ...filtresInitiaux };
  let favoris = new Set(lire('favoris', []));
  const abonnes = new Set();

  const prevenir = (raison) => {
    for (const abonne of abonnes) abonne(raison);
  };

  return {
    get filtres() {
      return filtres;
    },
    get favoris() {
      return favoris;
    },
    changerFiltres(changement) {
      filtres = { ...filtres, ...changement };
      prevenir('filtres');
    },
    reinitialiser() {
      filtres = { ...FILTRES_PAR_DEFAUT, tri: filtres.tri };
      prevenir('filtres');
    },
    basculerFavori(id) {
      favoris = new Set(favoris);
      if (favoris.has(id)) favoris.delete(id);
      else favoris.add(id);
      ecrire('favoris', [...favoris]);
      prevenir('favoris');
      return favoris.has(id);
    },
    recharger() {
      favoris = new Set(lire('favoris', []));
      prevenir('favoris');
    },
    abonner(fonction) {
      abonnes.add(fonction);
      return () => abonnes.delete(fonction);
    },
  };
}

/** Thème : 'systeme', 'light' ou 'dark'. */
export function lireTheme() {
  const theme = lire('theme', 'systeme');
  return theme === 'light' || theme === 'dark' ? theme : 'systeme';
}

export function appliquerTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  ecrire('theme', theme);
}
