import { describe, expect, it } from 'vitest';
import {
  analyserMarkdown,
  texteBrut,
  decouperACompleter,
  nombreACompleter,
  formaterDate,
  slugifier,
} from '../../src/js/texte.js';

describe('analyserMarkdown', () => {
  it('reconnaît gras, italique, code et liens', () => {
    expect(
      analyserMarkdown('Un **mot**, un *autre*, du `code` et [un lien](https://a.b/c).'),
    ).toEqual([
      { type: 'texte', texte: 'Un ' },
      { type: 'gras', texte: 'mot' },
      { type: 'texte', texte: ', un ' },
      { type: 'italique', texte: 'autre' },
      { type: 'texte', texte: ', du ' },
      { type: 'code', texte: 'code' },
      { type: 'texte', texte: ' et ' },
      { type: 'lien', texte: 'un lien', url: 'https://a.b/c' },
      { type: 'texte', texte: '.' },
    ]);
  });
  it('garde un lien placé dans du gras', () => {
    expect(analyserMarkdown('**Lire [le guide](https://x.y)**')).toEqual([
      { type: 'gras', texte: 'Lire ' },
      { type: 'lien', texte: 'le guide', url: 'https://x.y' },
    ]);
  });
  it('n’accepte que des liens http(s)', () => {
    expect(analyserMarkdown('[x](javascript:alert(1))')).toEqual([
      { type: 'texte', texte: '[x](javascript:alert(1))' },
    ]);
  });
  it('donne le texte brut', () => {
    expect(texteBrut('**Gras** et [lien](https://a.b)')).toBe('Gras et lien');
  });
});

describe('decouperACompleter', () => {
  it('repère les passages entre crochets', () => {
    expect(decouperACompleter('Résume [votre texte] en 3 points.')).toEqual([
      { texte: 'Résume ', aCompleter: false },
      { texte: '[votre texte]', aCompleter: true },
      { texte: ' en 3 points.', aCompleter: false },
    ]);
    expect(nombreACompleter('[le nom] et [tâche] et [critère]')).toBe(3);
  });
  it('ignore les cases à cocher, les nombres et les liens markdown', () => {
    expect(nombreACompleter('- [ ] tâche\n- [x] faite\n[1]\n[voir](https://a.b)')).toBe(0);
  });
});

describe('formaterDate et slugifier', () => {
  it('écrit la date en français', () => {
    expect(formaterDate('2026-10-02')).toBe('2 octobre 2026');
    expect(formaterDate('2026-08-01')).toBe('1er août 2026');
    expect(formaterDate('2026-02-14', { court: true })).toBe('14 févr. 2026');
    expect(formaterDate('n’importe quoi')).toBe('');
  });
  it('fait un identifiant lisible', () => {
    expect(slugifier('Vérifier l’IA : « oui » ou non ?')).toBe('verifier-l-ia-oui-ou-non');
  });
});
