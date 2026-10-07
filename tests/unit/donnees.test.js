import { describe, expect, it } from 'vitest';
import { FICHES } from '../../src/donnees/fiches.js';
import { CATEGORIES } from '../../src/donnees/referentiels.js';
import { erreursFiche, defautsTypographie } from '../../src/js/schema.js';

describe('les fiches', () => {
  it('existent', () => {
    expect(FICHES.length).toBeGreaterThan(100);
  });

  it('respectent toutes le schéma et la typographie', () => {
    const erreurs = FICHES.flatMap(erreursFiche);
    expect(erreurs).toEqual([]);
  });

  it('ont des identifiants et des sources uniques', () => {
    const ids = FICHES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cles = FICHES.map((f) => f.source.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('remplissent chaque catégorie', () => {
    for (const c of CATEGORIES) {
      expect(
        FICHES.some((f) => f.categorie === c.slug),
        c.slug,
      ).toBe(true);
    }
  });

  it('sont triées de la plus récente à la plus ancienne', () => {
    const dates = FICHES.map((f) => f.source.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('defautsTypographie', () => {
  it('signale apostrophes droites, guillemets anglais, emoji et trois points', () => {
    expect(defautsTypographie("l'IA")).toHaveLength(1);
    expect(defautsTypographie('un "mot"')).toHaveLength(1);
    expect(defautsTypographie('Bravo 🎉')).toHaveLength(1);
    expect(defautsTypographie('Et...')).toHaveLength(1);
    expect(defautsTypographie("L’IA dit « oui »… `it's` ok")).toEqual([]);
  });
});
