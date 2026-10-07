/**
 * L'en-tête sombre (la « scène » du design system) : titre, recherche et catégories.
 * Les catégories sont des boutons radio habillés en pastilles, avec leur nombre de fiches.
 */
import { el, remplir, pluriel, typographier } from '../ui.js';
import { icone } from '../icones.js';
import { CATEGORIES } from '../../donnees/referentiels.js';
import { compter } from '../filtres.js';
import { formaterDate } from '../texte.js';

export function monterScene(conteneur, magasin, fiches) {
  const nombres = compter(fiches, 'categorie');
  const plusRecente = fiches.reduce((d, f) => (f.source.date > d ? f.source.date : d), '');
  const plusAncienne = fiches.reduce((d, f) => (f.source.date < d ? f.source.date : d), '9999');

  const recherche = el('input', {
    type: 'search',
    id: 'recherche',
    class: 'champ champ--recherche champ--scene',
    placeholder: 'Rechercher une technique',
    'aria-label': 'Rechercher une technique',
    autocomplete: 'off',
    enterkeyhint: 'search',
    value: magasin.filtres.recherche,
  });

  const choix = [
    { slug: 'toutes', nom: 'Toutes', court: 'Toutes', icone: 'layer-group', nombre: fiches.length },
    ...CATEGORIES.map((c) => ({ ...c, nombre: nombres.get(c.slug) ?? 0 })),
  ];
  const pastilles = el(
    'fieldset',
    { class: 'categories' },
    el('legend', { class: 'categories__legende' }, 'Catégories'),
    el(
      'div',
      { class: 'pastilles' },
      choix.map((c) =>
        el(
          'label',
          {
            class: 'pastille',
            title: c.description ?? 'Toutes les catégories',
            'data-couleur': c.couleur,
          },
          el('input', {
            type: 'radio',
            name: 'categorie',
            value: c.slug,
            checked: magasin.filtres.categorie === c.slug,
          }),
          el(
            'span',
            { class: 'pastille__corps' },
            icone(c.icone),
            // Sur téléphone, le nom court : les neuf pastilles tiennent en trois lignes.
            el('span', { class: 'pastille__nom' }, c.nom),
            el('span', { class: 'pastille__nom pastille__nom--court' }, c.court),
            el('span', { class: 'pastille__nombre' }, String(c.nombre)),
          ),
        ),
      ),
    ),
  );
  const radios = [...pastilles.querySelectorAll('input')];

  remplir(
    conteneur,
    el(
      'div',
      { class: 'scene__interieur' },
      el(
        'div',
        { class: 'scene__titres' },
        el('p', { class: 'surtitre' }, 'The Neuron · AI Skill of the Day, en français'),
        el('h1', { id: 'titre-page' }, 'Des techniques de prompt prêtes à copier'),
        el(
          'p',
          { class: 'scene__chapo' },
          `${pluriel(fiches.length, 'technique')} tirées de la rubrique quotidienne de la newsletter The Neuron, « AI Skill of the Day » (« Prompt Tip of the Day » jusqu’en février 2026), publiées du ${formaterDate(plusAncienne)} au ${formaterDate(plusRecente)}. Chaque fiche explique la technique et donne le prompt à copier.`,
        ),
      ),
      el(
        'form',
        { class: 'scene__recherche', role: 'search', onsubmit: (e) => e.preventDefault() },
        el(
          'label',
          { class: 'champ-icone' },
          icone('magnifying-glass'),
          el('span', { class: 'hors-ecran' }, 'Rechercher une technique'),
          recherche,
        ),
      ),
      pastilles,
    ),
  );

  // Exemples de recherche dans le champ, seulement quand ils tiennent sans être coupés.
  const large = globalThis.matchMedia?.('(min-width: 640px)');
  const adapterExemple = () => {
    recherche.placeholder = typographier(
      large?.matches ? 'Rechercher : critique, agent, vidéo, Excel…' : 'Rechercher une technique',
    );
  };
  large?.addEventListener?.('change', adapterExemple);
  adapterExemple();

  let minuterie;
  recherche.addEventListener('input', () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => magasin.changerFiltres({ recherche: recherche.value }), 180);
  });
  recherche.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Enter') {
      evenement.preventDefault();
      clearTimeout(minuterie);
      magasin.changerFiltres({ recherche: recherche.value });
      document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
  pastilles.addEventListener('change', (evenement) => {
    magasin.changerFiltres({ categorie: evenement.target.value });
  });

  magasin.abonner((raison) => {
    if (raison !== 'filtres') return;
    const { categorie, recherche: texte } = magasin.filtres;
    for (const radio of radios) radio.checked = radio.value === categorie;
    if (document.activeElement !== recherche && recherche.value !== texte) recherche.value = texte;
  });

  return { recherche };
}
