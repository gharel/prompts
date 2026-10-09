/**
 * Thème commun à tous les outils Skazy Formation (même origine, donc même stockage) : une seule
 * clé, « skazy-outils:theme », que chaque outil lit, écrit et surveille (stockage.js).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLE_THEME, lireTheme, ecrireTheme, ecouterTheme } from '../../src/js/stockage.js';

// Ancienne clé propre à l'outil : plus lue ni écrite.
const ANCIENNE_CLE = 'skazy-prompts:theme';

const bloquer = () => {
  throw new Error('stockage bloqué');
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('thème commun aux outils', () => {
  it('a une seule clé, partagée par tous les outils', () => {
    expect(CLE_THEME).toBe('skazy-outils:theme');
  });

  it('lit un thème choisi, et le thème du système sinon', () => {
    expect(lireTheme()).toBe('systeme');
    localStorage.setItem(CLE_THEME, '"light"');
    expect(lireTheme()).toBe('light');
    localStorage.setItem(CLE_THEME, '"dark"');
    expect(lireTheme()).toBe('dark');
    for (const brut of ['"systeme"', '"auto"', 'null', '"sombre"', 'light', '{pas du json', '']) {
      localStorage.setItem(CLE_THEME, brut);
      expect(lireTheme(), brut).toBe('systeme');
    }
  });

  it('ne lit plus l’ancienne clé de l’outil', () => {
    localStorage.setItem(ANCIENNE_CLE, '"dark"');
    expect(lireTheme()).toBe('systeme');
  });

  it('écrit le thème choisi en JSON et efface la clé pour le thème du système', () => {
    expect(ecrireTheme('light')).toBe(true);
    expect(localStorage.getItem(CLE_THEME)).toBe('"light"');
    expect(ecrireTheme('dark')).toBe(true);
    expect(localStorage.getItem(CLE_THEME)).toBe('"dark"');
    expect(ecrireTheme('systeme')).toBe(true);
    expect(localStorage.getItem(CLE_THEME)).toBeNull();
    // Ni l'ancienne clé, ni une valeur pour le thème du système.
    expect(localStorage.length).toBe(0);
  });

  it('une erreur de stockage ne fait jamais planter la page', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(bloquer);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(bloquer);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(bloquer);
    expect(lireTheme()).toBe('systeme');
    expect(ecrireTheme('dark')).toBe(false);
    expect(ecrireTheme('systeme')).toBe(false);
  });

  it('prévient, avec le thème relu, quand il change dans un autre onglet ou un autre outil', () => {
    const recus = [];
    const arreter = ecouterTheme((theme) => recus.push(theme));
    localStorage.setItem(CLE_THEME, '"dark"');
    window.dispatchEvent(new StorageEvent('storage', { key: CLE_THEME }));
    window.dispatchEvent(new StorageEvent('storage', { key: ANCIENNE_CLE }));
    localStorage.clear();
    // Tout le stockage effacé : la clé vaut null.
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(recus).toEqual(['dark', 'systeme']);
    arreter();
    window.dispatchEvent(new StorageEvent('storage', { key: CLE_THEME }));
    expect(recus).toHaveLength(2);
  });

  it('relit le thème au retour sur une page gardée en mémoire par le navigateur', () => {
    const recus = [];
    const arreter = ecouterTheme((theme) => recus.push(theme));
    localStorage.setItem(CLE_THEME, '"light"');
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(recus).toEqual(['light']);
    arreter();
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    expect(recus).toEqual(['light']);
  });
});
