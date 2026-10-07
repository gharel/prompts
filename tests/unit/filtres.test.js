import { describe, expect, it } from 'vitest';
import {
  normaliser,
  motsRecherche,
  filtrer,
  trier,
  compter,
  auHasard,
  voisines,
  similaires,
  marcheAvec,
} from '../../src/js/filtres.js';

const fiche = (id, autres = {}) => ({
  id,
  titre: `Titre ${id}`,
  resume: 'Résumé',
  categorie: 'formuler',
  niveau: 'debutant',
  outils: ['tous'],
  corps: [{ t: 'p', x: 'Texte' }],
  prompts: [{ titre: 'Le prompt', type: 'prompt', texte: 'Rédige [ton texte]', adapte: false }],
  aRetenir: 'À retenir',
  source: { cle: id, date: '2026-01-01', url: '', titreOriginal: 'Original' },
  ...autres,
});

const FICHES = [
  fiche('a', { titre: 'Vérifier les chiffres', categorie: 'verifier', niveau: 'avance' }),
  fiche('b', {
    titre: 'Écrire un e-mail',
    outils: ['chatgpt'],
    source: { cle: 'b', date: '2026-03-01', titreOriginal: 'Email' },
  }),
  fiche('c', {
    titre: 'Coder avec un agent',
    categorie: 'coder',
    outils: ['claude-code'],
    source: { cle: 'c', date: '2025-06-01', titreOriginal: 'Agent' },
  }),
];

describe('normaliser et motsRecherche', () => {
  it('ignore les accents, la casse et l’apostrophe courbe', () => {
    expect(normaliser('Vérifier L’IA')).toBe("verifier l'ia");
  });
  it('découpe la recherche en mots de deux lettres ou plus', () => {
    expect(motsRecherche('  Écrire  un e-mail ! ')).toEqual(['ecrire', 'un', 'e-mail']);
    expect(motsRecherche('a')).toEqual([]);
  });
});

describe('filtrer', () => {
  it('sans filtre, renvoie tout', () => {
    expect(filtrer(FICHES, {})).toHaveLength(3);
  });
  it('cherche sans accents dans le titre', () => {
    expect(filtrer(FICHES, { recherche: 'verifier' }).map((f) => f.id)).toEqual(['a']);
  });
  it('cherche aussi dans le texte des prompts', () => {
    expect(filtrer(FICHES, { recherche: 'ton texte' })).toHaveLength(3);
  });
  it('exige tous les mots', () => {
    expect(filtrer(FICHES, { recherche: 'coder agent' }).map((f) => f.id)).toEqual(['c']);
    expect(filtrer(FICHES, { recherche: 'coder chiffres' })).toHaveLength(0);
  });
  it('filtre par catégorie et par niveau', () => {
    expect(filtrer(FICHES, { categorie: 'coder' }).map((f) => f.id)).toEqual(['c']);
    expect(filtrer(FICHES, { niveau: 'avance' }).map((f) => f.id)).toEqual(['a']);
    expect(filtrer(FICHES, { categorie: 'toutes', niveau: 'tous' })).toHaveLength(3);
  });
  it('un chatbot inclut les techniques valables partout, pas un agent de code', () => {
    expect(filtrer(FICHES, { outil: 'chatgpt' }).map((f) => f.id)).toEqual(['a', 'b']);
    expect(filtrer(FICHES, { outil: 'claude-code' }).map((f) => f.id)).toEqual(['c']);
    expect(marcheAvec(FICHES[0], 'codex')).toBe(false);
  });
  it('filtre les favoris', () => {
    expect(filtrer(FICHES, { favoris: true }, new Set(['b'])).map((f) => f.id)).toEqual(['b']);
    expect(filtrer(FICHES, { favoris: true }, new Set())).toHaveLength(0);
  });
});

describe('trier', () => {
  it('par date, du plus récent au plus ancien, ou l’inverse', () => {
    expect(trier(FICHES, 'recent').map((f) => f.id)).toEqual(['b', 'a', 'c']);
    expect(trier(FICHES, 'ancien').map((f) => f.id)).toEqual(['c', 'a', 'b']);
  });
  it('par ordre alphabétique français', () => {
    expect(trier(FICHES, 'alpha').map((f) => f.id)).toEqual(['c', 'b', 'a']);
  });
  it('ne modifie pas la liste d’origine', () => {
    const avant = FICHES.map((f) => f.id);
    trier(FICHES, 'alpha');
    expect(FICHES.map((f) => f.id)).toEqual(avant);
  });
});

describe('compter, auHasard, voisines, similaires', () => {
  it('compte par champ simple ou liste', () => {
    expect(compter(FICHES, 'categorie').get('formuler')).toBe(1);
    expect(compter(FICHES, 'outils').get('tous')).toBe(1);
  });
  it('tire une fiche avec le générateur donné', () => {
    expect(auHasard(FICHES, () => 0.99).id).toBe('c');
    expect(auHasard([], () => 0)).toBeNull();
  });
  it('trouve les voisines dans la liste', () => {
    expect(voisines(FICHES, 'b')).toEqual({ precedente: FICHES[0], suivante: FICHES[2] });
    expect(voisines(FICHES, 'z')).toEqual({ precedente: null, suivante: null });
  });
  it('propose des fiches de la même catégorie, sans la fiche elle-même', () => {
    const autres = [...FICHES, fiche('d', { categorie: 'coder' })];
    expect(similaires(autres, autres[2]).map((f) => f.id)).toEqual(['d']);
  });
});
