import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { ICONES, icone } from '../../src/js/icones.js';
import { TRACES } from '../../src/js/icones-donnees.js';
import { CATEGORIES } from '../../src/donnees/referentiels.js';

const SOURCES = ['src/js/', 'src/js/vues/'].flatMap((dossier) =>
  readdirSync(dossier)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(`${dossier}${f}`, 'utf8')),
);

describe('icônes', () => {
  it('toutes les icônes listées ont leur tracé (npm run icones)', () => {
    for (const nom of ICONES) expect(TRACES[nom], nom).toBeDefined();
  });

  it('chaque icone("…") du code est listée', () => {
    const appels = SOURCES.flatMap((texte) =>
      [...texte.matchAll(/icone\('([a-z/-]+)'/g)].map((m) => m[1]),
    );
    expect(appels.length).toBeGreaterThan(10);
    for (const nom of appels) expect(ICONES, nom).toContain(nom);
    for (const c of CATEGORIES) expect(ICONES, c.icone).toContain(c.icone);
  });

  it('dessine un SVG décoratif', () => {
    const svg = icone('copy');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(() => icone('inconnue')).toThrow();
  });
});
