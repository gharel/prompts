import { describe, expect, it } from 'vitest';
import {
  FILTRES_PAR_DEFAUT,
  filtresDepuisAdresse,
  adresseDepuisFiltres,
  nombreFiltresActifs,
  creerEtat,
} from '../../src/js/etat.js';

describe('adresse ↔ filtres', () => {
  it('une adresse vide donne les filtres par défaut', () => {
    expect(filtresDepuisAdresse('')).toEqual(FILTRES_PAR_DEFAUT);
    expect(adresseDepuisFiltres(FILTRES_PAR_DEFAUT)).toBe('');
  });
  it('fait l’aller-retour', () => {
    const filtres = {
      ...FILTRES_PAR_DEFAUT,
      recherche: 'agent',
      categorie: 'coder',
      niveau: 'avance',
      favoris: true,
    };
    const adresse = adresseDepuisFiltres(filtres);
    expect(adresse).toBe('?q=agent&categorie=coder&niveau=avance&favoris=1');
    expect(filtresDepuisAdresse(adresse)).toEqual(filtres);
  });
  it('ignore une valeur inconnue', () => {
    const filtres = filtresDepuisAdresse('?categorie=pirate&tri=alpha', {
      categorie: ['toutes', 'coder'],
      tri: ['recent', 'alpha'],
    });
    expect(filtres.categorie).toBe('toutes');
    expect(filtres.tri).toBe('alpha');
  });
  it('compte les filtres actifs, sans le tri', () => {
    expect(nombreFiltresActifs({ ...FILTRES_PAR_DEFAUT, tri: 'alpha' })).toBe(0);
    expect(nombreFiltresActifs({ ...FILTRES_PAR_DEFAUT, recherche: ' x ', outil: 'claude' })).toBe(
      2,
    );
  });
});

describe('creerEtat', () => {
  it('prévient les abonnés et garde les favoris', () => {
    localStorage.clear();
    const magasin = creerEtat();
    const raisons = [];
    magasin.abonner((r) => raisons.push(r));
    magasin.changerFiltres({ categorie: 'coder' });
    expect(magasin.filtres.categorie).toBe('coder');
    expect(magasin.basculerFavori('abc')).toBe(true);
    expect(JSON.parse(localStorage.getItem('skazy-prompts:favoris'))).toEqual(['abc']);
    expect(magasin.basculerFavori('abc')).toBe(false);
    magasin.reinitialiser();
    expect(magasin.filtres.categorie).toBe('toutes');
    expect(raisons).toEqual(['filtres', 'favoris', 'favoris', 'filtres']);
  });
});
