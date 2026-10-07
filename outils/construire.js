/**
 * npm run build : construit dist/index.html, un fichier unique et autonome.
 * - le JavaScript (modules de src/js) est regroupé par esbuild en un seul script ;
 * - les feuilles de style sont regroupées, avec les polices intégrées en data URI ;
 * - les logos et l'icône de l'onglet sont intégrés en data URI.
 * Le fichier s'ouvre hors ligne en double-cliquant, sans aucune requête réseau.
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const SRC = `${RACINE}src/`;
const DIST = `${RACINE}dist/`;

const js = await build({
  entryPoints: [`${SRC}js/main.js`],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  charset: 'utf8',
  legalComments: 'none',
  write: false,
});

const html = readFileSync(`${SRC}index.html`, 'utf8');
const feuilles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)" \/>/g)].map((m) => m[1]);

const css = await build({
  stdin: {
    contents: feuilles.map((f) => `@import './${f}';`).join('\n'),
    resolveDir: SRC,
    loader: 'css',
  },
  bundle: true,
  minify: true,
  charset: 'utf8',
  loader: { '.woff2': 'dataurl' },
  write: false,
});

function dataUri(chemin) {
  const contenu = readFileSync(`${SRC}${chemin}`);
  const type = chemin.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
  return `data:${type};base64,${contenu.toString('base64')}`;
}

const texteJs = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const texteCss = css.outputFiles[0].text.replace(/<\/style/gi, '<\\/style');

const sortie = html
  // Les feuilles de style deviennent un seul <style>.
  .replace(/(\s*)<link rel="stylesheet" href="[^"]+" \/>/, `$1<style>${texteCss}</style>`)
  .replace(/\s*<link rel="stylesheet" href="[^"]+" \/>/g, '')
  // Le module devient un script en fin de page (un script en ligne n'est pas différé).
  .replace(/\s*<script type="module" src="js\/main\.js"><\/script>/, '')
  .replace('</body>', `<script>${texteJs}</script>\n  </body>`)
  // Images et icône d'onglet intégrées.
  .replace(
    /(src|href)="(assets\/img\/[^"]+)"/g,
    (_t, attribut, chemin) => `${attribut}="${dataUri(chemin)}"`,
  );

const restes = sortie.match(/(?:src|href)="(?!https?:|data:|#|index\.html)[^"]+"/g);
if (restes) {
  console.error(`Ressources non intégrées : ${restes.join(', ')}`);
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });
writeFileSync(`${DIST}index.html`, sortie);
const ko = (Buffer.byteLength(sortie) / 1024).toFixed(0);
console.log(`dist/index.html construit (${ko} Ko) : fichier unique, ouvrable hors ligne.`);
