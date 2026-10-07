import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Collecte les erreurs de la page (console et exceptions) pour vérifier qu'il n'y en a aucune. */
export function surveillerErreurs(page) {
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`exception : ${e.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') erreurs.push(`console : ${message.text()}`);
  });
  return erreurs;
}

/**
 * Vérifie l'accessibilité : aucune violation grave ou critique (axe-core), et une typographie
 * qui ne laisse jamais ? ! ; : seul en début de ligne (verifierTypographie).
 */
export async function verifierAccessibilite(page) {
  const resultats = await new AxeBuilder({ page }).analyze();
  const graves = resultats.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} : ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`);
  expect(graves, graves.join('\n')).toEqual([]);
  await verifierTypographie(page);
}

/**
 * Typographie française de tout le texte affiché (et des placeholders, info-bulles) :
 * une espace insécable avant ? ! ; : » et après «. Une espace ordinaire laisserait la
 * ponctuation seule en début de ligne ; l'espace fine, trop étroite, ne se voit pas.
 */
export async function verifierTypographie(page) {
  const fautes = await page.evaluate(() => {
    const textes = [];
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (parcours.nextNode()) {
      const noeud = parcours.currentNode;
      // Les prompts (pre, code) se copient tels quels ; les titres anglais (lang="en") aussi.
      if (
        noeud.parentElement?.closest(
          'script, style, noscript, textarea, svg, pre, code, [lang="en"]',
        )
      )
        continue;
      textes.push(noeud.textContent);
    }
    for (const element of document.querySelectorAll('[placeholder], [title]')) {
      textes.push(element.getAttribute('placeholder') ?? '', element.getAttribute('title') ?? '');
    }
    const regles = [
      [/[ \u202f][!?;:»]/u, 'espace sécable ou fine avant la ponctuation'],
      [/«[ \u202f]/u, 'espace sécable ou fine après «'],
      [/[\p{L}\p{N}][!?;:](?=\s|$)/u, 'ponctuation collée au mot'],
    ];
    return textes.flatMap((texte) =>
      regles.filter(([motif]) => motif.test(texte)).map(([, faute]) => `${faute} : « ${texte} »`),
    );
  });
  expect(fautes, fautes.join('\n')).toEqual([]);
}
