/**
 * Montage de la page : état, bandeau, scène, résultats, fiche, à propos, pied.
 * L'adresse garde les filtres (?categorie=verifier) et la fiche ouverte (#id-de-la-fiche).
 */
import { FICHES } from '../donnees/fiches.js';
import { CATEGORIES, NIVEAUX, OUTILS } from '../donnees/referentiels.js';
import { el, remplir, pluriel } from './ui.js';
import { icone } from './icones.js';
import { ecouterStockage } from './stockage.js';
import { TRIS } from './filtres.js';
import { creerEtat, filtresDepuisAdresse, adresseDepuisFiltres } from './etat.js';
import { formaterDate } from './texte.js';
import { monterBandeau } from './vues/bandeau.js';
import { monterScene } from './vues/scene.js';
import { monterResultats } from './vues/resultats.js';
import { monterFiche } from './vues/fiche.js';
import { monterAPropos } from './vues/apropos.js';
import { lienExterne, DROITS, USAGE_RESERVE } from './vues/commun.js';

const $ = (id) => document.getElementById(id);

const magasin = creerEtat(
  filtresDepuisAdresse(globalThis.location.search, {
    categorie: ['toutes', ...CATEGORIES.map((c) => c.slug)],
    niveau: ['tous', ...NIVEAUX.map((n) => n.slug)],
    outil: OUTILS.map((o) => o.slug),
    tri: TRIS.map((t) => t.slug),
  }),
);

const apropos = monterAPropos($('apropos'), magasin, FICHES);
monterBandeau($('actions-bandeau'), magasin, { ouvrirAPropos: () => apropos.ouvrir() });
monterScene($('scene'), magasin, FICHES);
const resultats = monterResultats($('resultats'), magasin, FICHES);
const fiche = monterFiche($('fiche'), magasin, FICHES, { courants: resultats.courants });

// Les filtres sont recopiés dans l'adresse, sans ajouter d'étape à l'historique.
magasin.abonner((raison) => {
  if (raison !== 'filtres') return;
  const adresse = `${globalThis.location.pathname}${adresseDepuisFiltres(magasin.filtres)}${globalThis.location.hash}`;
  history.replaceState(null, '', adresse);
});

// Favoris modifiés dans un autre onglet.
ecouterStockage('favoris', () => magasin.recharger());

// #id-de-la-fiche dans l'adresse : ouvre la fiche (lien partagé, clic sur une carte).
function ouvrirDepuisAdresse() {
  const id = decodeURIComponent(globalThis.location.hash.slice(1));
  if (id && /^[a-z0-9-]+$/.test(id)) {
    fiche.ouvrir(id);
  } else if (fiche.estOuverte()) {
    fiche.fermer();
  }
}
globalThis.addEventListener('hashchange', ouvrirDepuisAdresse);
ouvrirDepuisAdresse();

// Bouton « Revenir en haut », visible après un écran de défilement.
const haut = $('haut-de-page');
haut.prepend(icone('arrow-up'));
haut.addEventListener('click', () => {
  globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  $('recherche')?.focus({ preventScroll: true });
});
const surveillerDefilement = () => {
  haut.hidden = globalThis.scrollY < globalThis.innerHeight * 1.2;
};
globalThis.addEventListener('scroll', surveillerDefilement, { passive: true });
surveillerDefilement();

const plusRecente = FICHES.reduce((d, f) => (f.source.date > d ? f.source.date : d), '');
remplir(
  $('pied'),
  el(
    'p',
    {},
    el('strong', {}, 'Prompthèque'),
    ` · ${pluriel(FICHES.length, 'technique')} de prompt traduites de la rubrique « AI Skill of the Day » (anciennement « Prompt Tip of the Day ») de la newsletter The Neuron. Dernière édition : ${formaterDate(plusRecente)}.`,
  ),
  el(
    'p',
    {},
    'Traduction et adaptation : Skazy Formation. Chaque fiche renvoie à l’article original en anglais. ',
    lienExterne('theneurondaily.com', 'https://www.theneurondaily.com', { classe: 'lien-pied' }),
  ),
  el(
    'p',
    {},
    `${DROITS}, Nouvelle-Calédonie · `,
    lienExterne('formation.skazy.nc', 'https://formation.skazy.nc', { classe: 'lien-pied' }),
  ),
  el('p', {}, USAGE_RESERVE),
);

document.documentElement.classList.add('pret');
