// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  nettoyer,
  pageArchive,
  extraireCompetences,
  estRubrique,
  nomRubrique,
  titreCompetence,
  sansPisteurs,
} from '../../outils/neuron.js';

/** Une édition réduite, dans la forme des pages de theneurondaily.com. */
const PAGE = `<html><head>
<meta content="😺 Une édition de test" property="og:title"/>
<meta content="PLUS : autre chose" property="og:description"/>
<script type="application/ld+json">{"datePublished":"2026-10-02T09:30:00.000Z"}</script>
</head><body><div class="rendered-post"><div id="content-blocks">
<div id="actu"><h1 style="color:red">L'actu du jour</h1></div>
<div><p style="x">Une nouvelle sans rapport.</p></div>
<div id="ai-skill"><h1>🎓 AI Skill of the Day: Make AI interview you</h1></div>
<div><p>Talk first, <b>then</b> <a href="https://x.com/a?utm_source=neuron&amp;id=3">write</a>.</p></div>
<div><ol><li><p>Dump the idea.</p></li><li><p>Ask for an interview.</p></li></ol></div>
<div><pre><code>I'm going to talk.
Don't write yet.</code></pre></div>
<div><a href="https://example.com/shot"><img src="https://img/x.png" alt=""></a></div>
<div><p><b>Have a specific skill you want to learn?</b> <a href="https://forms">Request it here.</a></p></div>
<div><p>Hors section.</p></div>
<div id="treats"><h1>Treats to Try</h1></div>
<div><audio><source src="https://s3/x.mp3?X-Amz-Signature=abc"></audio><p>Pub.</p></div>
</div></div><script>var x = 1;</script></body></html>`;

describe('nettoyer', () => {
  it('garde le corps sans styles, sans pisteurs ni audio, avec date et titre', () => {
    const edition = nettoyer(PAGE, 'https://www.theneurondaily.com/p/test');
    expect(edition.titre).toBe('😺 Une édition de test');
    expect(edition.sousTitre).toBe('PLUS : autre chose');
    expect(edition.date).toBe('2026-10-02T09:30:00.000Z');
    expect(edition.corps).not.toMatch(/style=|utm_|audio|X-Amz/);
    expect(edition.corps).toContain('https://x.com/a?id=3');
  });

  it('donne une archive qui se relit comme la page d’origine', () => {
    const edition = nettoyer(PAGE, 'https://www.theneurondaily.com/p/test');
    const archive = pageArchive(edition, '2026-10-07T00:00:00.000Z');
    expect(archive).toContain(
      '<meta name="source" content="https://www.theneurondaily.com/p/test">',
    );
    expect(archive).toContain('<meta name="date-publication" content="2026-10-02T09:30:00.000Z">');
    expect(extraireCompetences(archive)).toEqual(extraireCompetences(PAGE));
    expect(nettoyer(archive).date).toBe('2026-10-02T09:30:00.000Z');
  });

  it('refuse une page sans corps d’édition', () => {
    expect(nettoyer('<html><body><p>Rien</p></body></html>', 'x')).toBeNull();
  });
});

describe('extraireCompetences', () => {
  it('sort la section, découpée en blocs, jusqu’à l’autopromotion', () => {
    expect(extraireCompetences(PAGE)).toEqual([
      {
        rubrique: 'AI Skill of the Day',
        titreOriginal: 'Make AI interview you',
        blocs: [
          { t: 'p', x: 'Talk first, **then** [write](https://x.com/a?id=3).' },
          { t: 'ol', x: ['Dump the idea.', 'Ask for an interview.'] },
          { t: 'pre', x: "I'm going to talk.\nDon't write yet." },
          { t: 'img', x: 'https://img/x.png', lien: 'https://example.com/shot' },
        ],
      },
    ]);
  });

  it('reconnaît les anciens noms de la rubrique', () => {
    const ancienne = PAGE.replace(
      '🎓 AI Skill of the Day: Make AI interview you',
      'Prompt Tip of the Day ',
    );
    const [section] = extraireCompetences(ancienne);
    expect(section.rubrique).toBe('Prompt Tip of the Day');
    expect(section.titreOriginal).toBe('');
    expect(section.blocs).toHaveLength(4);
  });
});

describe('rubrique', () => {
  it('reconnaît les intitulés', () => {
    expect(estRubrique('🎓 AI Skill of the Day: X')).toBe(true);
    expect(estRubrique('Prompt Tip of the Day.')).toBe(true);
    expect(estRubrique('Agent Tip of the Day')).toBe(true);
    expect(estRubrique('Prompt tip of the week')).toBe(true);
    expect(estRubrique('Prompt Tip: Simple format changes')).toBe(true);
    expect(estRubrique('Treats to Try')).toBe(false);
    expect(estRubrique('Some handy o1 prompt tips!')).toBe(false);
  });
  it('nomme la rubrique et en retire l’intitulé', () => {
    expect(nomRubrique('Prompt Tip: Simple format')).toBe('Prompt Tip of the Week');
    expect(nomRubrique('Perplexity Prompt Tip of the Day')).toBe('Prompt Tip of the Day');
    expect(nomRubrique('🎓 AI Skill of the Day: X')).toBe('AI Skill of the Day');
    expect(titreCompetence('🎓 AI Skill of the Day : Use Notebooks')).toBe('Use Notebooks');
    expect(titreCompetence('NEW SECTION: AI Skill of the Day!')).toBe('');
    expect(titreCompetence('Prompt Tip: Simple format changes')).toBe('Simple format changes');
  });
  it('retire les paramètres de suivi', () => {
    expect(sansPisteurs('https://a.b/c?utm_source=x&id=2')).toBe('https://a.b/c?id=2');
    expect(sansPisteurs('pas une adresse')).toBe('pas une adresse');
  });
});
