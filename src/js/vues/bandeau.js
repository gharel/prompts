/**
 * Les actions du bandeau : Mes favoris, À propos, thème.
 */
import { el, remplir, typographier } from '../ui.js';
import { icone } from '../icones.js';
import { lireTheme, appliquerTheme } from '../etat.js';

const THEMES = {
  systeme: { suivant: 'light', icone: 'circle-half-stroke', nom: 'Thème : celui du système' },
  light: { suivant: 'dark', icone: 'sun', nom: 'Thème : clair' },
  dark: { suivant: 'systeme', icone: 'moon', nom: 'Thème : sombre' },
};

export function monterBandeau(conteneur, magasin, { ouvrirAPropos }) {
  let theme = lireTheme();
  const boutonTheme = el('button', { type: 'button', class: 'bouton-icone', id: 'bouton-theme' });
  boutonTheme.addEventListener('click', () => {
    theme = THEMES[theme].suivant;
    appliquerTheme(theme);
    synchroniserTheme();
  });

  const compteur = el('span', { class: 'compteur' });
  const boutonFavoris = el(
    'button',
    {
      type: 'button',
      class: 'bouton bouton--fantome bouton-favoris',
      id: 'bouton-favoris',
      onclick: () => {
        const actif = !magasin.filtres.favoris;
        magasin.changerFiltres({ favoris: actif });
        document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    icone('bookmark'),
    el('span', { class: 'bouton-favoris__texte' }, 'Mes favoris'),
    compteur,
  );

  remplir(
    conteneur,
    boutonFavoris,
    el(
      'button',
      {
        type: 'button',
        class: 'bouton bouton--fantome bouton-apropos',
        'aria-label': 'À propos de la Prompthèque',
        title: 'À propos de la Prompthèque',
        onclick: ouvrirAPropos,
      },
      icone('circle-info'),
      el('span', { class: 'bouton-apropos__texte' }, 'À propos'),
    ),
    boutonTheme,
  );

  function synchroniserTheme() {
    const t = THEMES[theme];
    boutonTheme.replaceChildren(icone(t.icone));
    boutonTheme.setAttribute('aria-label', typographier(`${t.nom}. Changer de thème`));
    boutonTheme.title = typographier(t.nom);
  }

  function synchroniserFavoris() {
    const n = magasin.favoris.size;
    compteur.textContent = String(n);
    compteur.hidden = n === 0;
    boutonFavoris.setAttribute('aria-pressed', String(magasin.filtres.favoris));
    boutonFavoris.setAttribute('aria-label', n ? `Mes favoris, ${n}` : 'Mes favoris, aucun');
  }

  magasin.abonner(synchroniserFavoris);
  synchroniserTheme();
  synchroniserFavoris();
}
