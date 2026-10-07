/**
 * Le panneau « À propos » : à quoi sert la Prompthèque, comment s'en servir, les catégories,
 * les niveaux, la source et les règles de prudence.
 */
import { el, remplir, pluriel } from '../ui.js';
import { icone } from '../icones.js';
import { CATEGORIES, NIVEAUX } from '../../donnees/referentiels.js';
import { compter } from '../filtres.js';
import { lienExterne } from './commun.js';

export function monterAPropos(dialogue, magasin, fiches) {
  const nombres = compter(fiches, 'categorie');
  const niveaux = compter(fiches, 'niveau');

  function fermer() {
    dialogue.close();
  }

  dialogue.addEventListener('click', (evenement) => {
    if (evenement.target === dialogue) fermer();
  });

  function choisirCategorie(slug) {
    magasin.changerFiltres({ categorie: slug });
    fermer();
    document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth' });
  }

  remplir(
    dialogue,
    el(
      'header',
      { class: 'panneau__entete' },
      el(
        'div',
        {},
        el('p', { class: 'surtitre surtitre--clair' }, 'Prompthèque'),
        el('h2', { id: 'titre-apropos' }, 'À propos'),
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'bouton-icone',
          'aria-label': 'Fermer',
          title: 'Fermer (Échap)',
          onclick: fermer,
        },
        icone('xmark'),
      ),
    ),
    el(
      'div',
      { class: 'panneau__corps apropos' },
      el(
        'section',
        {},
        el('h3', {}, 'Une technique par fiche, un prompt à copier'),
        el(
          'p',
          {},
          `La Prompthèque rassemble ${pluriel(fiches.length, 'technique')} publiées dans la rubrique quotidienne de The Neuron, une newsletter sur l’IA en anglais : « AI Skill of the Day », appelée « Prompt Tip of the Day » jusqu’en février 2026. Skazy Formation les a traduites, adaptées et classées pour que vous puissiez les appliquer tout de suite, en français.`,
        ),
      ),
      el(
        'section',
        {},
        el('h3', {}, 'Comment s’en servir'),
        el(
          'ol',
          { class: 'apropos__etapes' },
          el(
            'li',
            {},
            el('strong', {}, 'Trouvez une technique'),
            ' par catégorie, niveau ou outil, ou en tapant un mot : « critique », « Excel », « vidéo ».',
          ),
          el(
            'li',
            {},
            el('strong', {}, 'Copiez le prompt'),
            ' et remplacez les passages ',
            el('mark', { class: 'a-completer' }, '[entre crochets]'),
            ' par votre propre contenu.',
          ),
          el(
            'li',
            {},
            el('strong', {}, 'Relisez la réponse'),
            ' : l’IA peut se tromper avec assurance. Vérifiez chiffres, noms et sources.',
          ),
          el(
            'li',
            {},
            el('strong', {}, 'Gardez vos préférées'),
            ' avec le signet : elles s’affichent dans « Mes favoris », sur cet appareil.',
          ),
        ),
      ),
      el(
        'section',
        {},
        el('h3', {}, 'Les catégories'),
        el(
          'ul',
          { class: 'apropos__categories' },
          CATEGORIES.map((c) =>
            el(
              'li',
              { 'data-couleur': c.couleur },
              el(
                'button',
                {
                  type: 'button',
                  class: 'apropos__categorie',
                  onclick: () => choisirCategorie(c.slug),
                },
                el('span', { class: 'apropos__pastille' }, icone(c.icone)),
                el(
                  'span',
                  { class: 'apropos__texte' },
                  el('strong', {}, c.nom),
                  el('span', {}, c.description),
                ),
                el('span', { class: 'apropos__nombre' }, String(nombres.get(c.slug) ?? 0)),
              ),
            ),
          ),
        ),
      ),
      el(
        'section',
        {},
        el('h3', {}, 'Les niveaux'),
        el(
          'dl',
          { class: 'apropos__niveaux' },
          NIVEAUX.map((n) => [
            el('dt', {}, icone('stairs'), `${n.nom} (${niveaux.get(n.slug) ?? 0})`),
            el('dd', {}, n.description),
          ]),
        ),
      ),
      el(
        'section',
        { class: 'apropos__prudence' },
        el('h3', {}, icone('shield-halved'), 'Avant de coller quoi que ce soit'),
        el(
          'p',
          {},
          'Ne collez pas de données personnelles, de mots de passe ni de documents confidentiels dans un outil d’IA sans l’accord de votre organisation. Les fonctions et les noms de modèles évoluent vite : une fiche peut citer un outil qui a changé depuis.',
        ),
      ),
      el(
        'section',
        {},
        el('h3', {}, 'Source'),
        el(
          'p',
          {},
          'Chaque fiche indique la date de l’édition et renvoie à l’article original de The Neuron. Les traductions sont adaptées : certains passages sont condensés, et quand un article ne donnait pas de prompt prêt à l’emploi, Skazy Formation en propose un, signalé comme tel. Les noms d’outils et de modèles sont ceux de la date de publication. The Neuron n’est pas associé à Skazy Formation.',
        ),
        el(
          'p',
          { class: 'apropos__liens' },
          lienExterne('The Neuron (en anglais)', 'https://www.theneurondaily.com'),
          lienExterne('Skazy Formation', 'https://formation.skazy.nc'),
        ),
      ),
    ),
  );

  return {
    ouvrir() {
      if (!dialogue.open) dialogue.showModal();
      dialogue.querySelector('.panneau__corps').scrollTop = 0;
    },
  };
}
