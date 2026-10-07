/**
 * Lecture des newsletters The Neuron (theneurondaily.com, plateforme beehiiv) :
 * - nettoyer() garde le corps complet d'une édition, sans styles ni pisteurs, avec sa date,
 *   son titre et son adresse : c'est le format des archives (archives/the-neuron/) ;
 * - extraireCompetences() sort la ou les sections « AI Skill of the Day » d'une édition,
 *   découpées en blocs (paragraphes, listes, prompts) prêts à traduire.
 * Fonctionne aussi bien sur la page brute téléchargée que sur une page archivée.
 */
import { JSDOM } from 'jsdom';

const ATTRIBUTS_GARDES = new Set(['href', 'src', 'alt', 'id', 'colspan', 'rowspan', 'datetime']);

/** Retire les paramètres de suivi (utm_…) et les signatures d'accès temporaires d'une adresse. */
export function sansPisteurs(adresse) {
  try {
    const url = new URL(adresse);
    for (const cle of [...url.searchParams.keys()]) {
      if (cle.startsWith('utm_') || cle.startsWith('X-Amz-')) url.searchParams.delete(cle);
    }
    return url.toString();
  } catch {
    return adresse;
  }
}

function meta(brut, propriete) {
  const balise = brut.match(new RegExp(`<meta[^>]*(?:property|name)="${propriete}"[^>]*>`, 'i'));
  if (!balise) return '';
  const contenu = balise[0].match(/content="([^"]*)"/i);
  if (!contenu) return '';
  return JSDOM.fragment(`<p>${contenu[1]}</p>`).textContent.trim();
}

/** Morceau de page qui contient le corps de l'édition (#content-blocks). */
function morceauCorps(brut) {
  let debut = brut.indexOf('id="content-blocks"');
  if (debut < 0) return null;
  debut = brut.lastIndexOf('<', debut);
  const fin = brut.indexOf('<script', debut);
  return brut.slice(debut, fin > 0 ? fin : brut.length);
}

/**
 * Page brute (ou archivée) → { titre, sousTitre, date, url, corps } ; corps est le HTML nettoyé
 * de #content-blocks. Renvoie null si la page n'a pas de corps d'édition.
 */
export function nettoyer(brut, url) {
  const morceau = morceauCorps(brut);
  if (!morceau) return null;
  const fragment = JSDOM.fragment(morceau);
  const corps = fragment.querySelector('#content-blocks');
  if (!corps) return null;
  for (const inutile of corps.querySelectorAll(
    'style, script, noscript, svg, iframe, form, input, audio, video',
  )) {
    inutile.remove();
  }
  for (const element of [corps, ...corps.querySelectorAll('*')]) {
    for (const attribut of [...element.attributes]) {
      if (!ATTRIBUTS_GARDES.has(attribut.name)) element.removeAttribute(attribut.name);
    }
    if (element.hasAttribute('href'))
      element.setAttribute('href', sansPisteurs(element.getAttribute('href')));
  }
  // Les commentaires et les blocs vides ne servent à rien dans une archive.
  const parcours = fragment.ownerDocument.createTreeWalker(corps, 128 /* commentaires */);
  const commentaires = [];
  while (parcours.nextNode()) commentaires.push(parcours.currentNode);
  for (const c of commentaires) c.remove();
  for (const div of [...corps.querySelectorAll('div')].reverse()) {
    if (!div.children.length && !div.textContent.trim()) div.remove();
  }

  const date = brut.match(/"datePublished":"([^"]+)"/)?.[1] ?? meta(brut, 'date-publication');
  return {
    titre: meta(brut, 'og:title') || brut.match(/<title>([^<]*)<\/title>/)?.[1] || '',
    sousTitre: meta(brut, 'og:description') || meta(brut, 'description'),
    date,
    url: url ?? meta(brut, 'source'),
    corps: corps.outerHTML.replace(/\n{3,}/g, '\n\n'),
  };
}

const echapper = (texte) =>
  String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Page d'archive autonome : métadonnées dans <head>, corps de l'édition dans <article>. */
export function pageArchive({ titre, sousTitre, date, url, corps }, recupereLe) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${echapper(titre)}</title>
<meta property="og:title" content="${echapper(titre)}">
<meta property="og:description" content="${echapper(sousTitre)}">
<meta name="source" content="${echapper(url)}">
<meta name="date-publication" content="${echapper(date)}">
<meta name="date-recuperation" content="${echapper(recupereLe)}">
</head>
<body>
<article>
<header>
<p>The Neuron · ${echapper(date.slice(0, 10))} · <a href="${echapper(url)}">${echapper(url)}</a></p>
<p>${echapper(sousTitre)}</p>
</header>
${corps}
</article>
</body>
</html>
`;
}

// ── Sections « AI Skill of the Day » ─────────────────────────────────────────

/** Paragraphes qui terminent la section : autopromotion de la newsletter, partenaires. */
const FINS = [
  /^want more (in[- ]?depth )?(tips|skills|ai skills)\b/i,
  /^total ai beginner/i,
  /^p\.?s\.?:? ?we published/i,
  /^have a specific skill/i,
  /^from our partners/i,
  /^that'?s all for today/i,
  /^see you cool cats/i,
  /^a quick favor/i,
];

function enLigne(noeud) {
  let texte = '';
  for (const enfant of noeud.childNodes) {
    if (enfant.nodeType === 3) texte += enfant.textContent;
    else if (enfant.nodeType !== 1) continue;
    else if (enfant.tagName === 'BR') texte += '\n';
    else if (enfant.tagName === 'A' && enfant.getAttribute('href')) {
      const t = enLigne(enfant).trim();
      if (t) texte += `[${t}](${sansPisteurs(enfant.getAttribute('href'))})`;
    } else if (enfant.tagName === 'STRONG' || enfant.tagName === 'B') {
      const t = enLigne(enfant);
      texte += t.trim() ? `**${t.trim()}**` : t;
    } else if (enfant.tagName === 'EM' || enfant.tagName === 'I') {
      const t = enLigne(enfant);
      texte += t.trim() ? `*${t.trim()}*` : t;
    } else if (enfant.tagName === 'CODE') texte += `\`${enfant.textContent}\``;
    else texte += enLigne(enfant);
  }
  return texte;
}

function propre(texte) {
  return texte
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\*\*\s*\*\*/g, '')
    .trim();
}

function blocs(noeud, sortie) {
  if (noeud.nodeType !== 1) return;
  const balise = noeud.tagName;
  if (balise === 'IMG') {
    // Une capture d'écran liée (souvent le prompt lui-même) ; les séparateurs ne sont pas liés.
    const lien = noeud.closest('a')?.getAttribute('href');
    if (lien) sortie.push({ t: 'img', x: noeud.getAttribute('src'), lien: sansPisteurs(lien) });
    return;
  }
  if (['SCRIPT', 'STYLE', 'SVG', 'IFRAME', 'BUTTON', 'FORM'].includes(balise)) return;
  if (/^H[1-6]$/.test(balise)) {
    const t = propre(enLigne(noeud));
    if (t) sortie.push({ t: 'h', x: t });
    return;
  }
  if (balise === 'PRE') {
    sortie.push({
      t: 'pre',
      x: noeud.textContent.replace(/\u00a0/g, ' ').replace(/^\n+|\n+$/g, ''),
    });
    return;
  }
  if (balise === 'UL' || balise === 'OL') {
    const elements = [];
    for (const li of noeud.children) {
      if (li.tagName !== 'LI') continue;
      const copie = li.cloneNode(true);
      const sousListes = [...copie.children].filter(
        (c) => c.tagName === 'UL' || c.tagName === 'OL',
      );
      for (const s of sousListes) s.remove();
      const t = propre(enLigne(copie));
      if (t) elements.push(t);
      for (const s of sousListes) {
        for (const sli of s.children) elements.push(`  - ${propre(enLigne(sli))}`);
      }
    }
    if (elements.length) sortie.push({ t: balise === 'OL' ? 'ol' : 'ul', x: elements });
    return;
  }
  if (balise === 'BLOCKQUOTE' || balise === 'P') {
    const t = propre(enLigne(noeud));
    if (t) sortie.push({ t: balise === 'P' ? 'p' : 'quote', x: t });
    return;
  }
  if (balise === 'TABLE') {
    const lignes = [...noeud.querySelectorAll('tr')].map((tr) =>
      [...tr.querySelectorAll('td, th')].map((c) => propre(enLigne(c))),
    );
    if (lignes.length) sortie.push({ t: 'table', x: lignes });
    return;
  }
  for (const enfant of noeud.childNodes) blocs(enfant, sortie);
}

function estFin(bloc) {
  if (bloc.t !== 'p' && bloc.t !== 'h') return false;
  const texte = bloc.x
    .replace(/\]\([^)]*\)/g, '')
    .replace(/[*_[\]`]/g, '')
    .trim();
  return FINS.some((motif) => motif.test(texte));
}

/**
 * La rubrique s'est appelée « Prompt Tip of the Week » (fin 2024), puis « Prompt Tip of the Day »
 * (2025, avec des variantes : Agent, Operator, Perplexity… Tip of the Day), puis
 * « AI Skill of the Day » à partir du 2 mars 2026. Un intitulé de section de la rubrique :
 */
export function estRubrique(titre) {
  const t = String(titre).trim();
  if (!t || t.length >= 300) return false;
  return (
    /skill of the day/i.test(t) ||
    /\b(prompt|agent|operator|skill) tip of the (day|week)\b/i.test(t) ||
    /^prompt tip\s*:/i.test(t)
  );
}

/** Nom de la rubrique d'après l'intitulé de la section. */
export function nomRubrique(titre) {
  if (/tip of the week/i.test(titre) || /^prompt tip\s*:/i.test(titre))
    return 'Prompt Tip of the Week';
  if (/skill of the day/i.test(titre) && !/tip of the day/i.test(titre))
    return 'AI Skill of the Day';
  return 'Prompt Tip of the Day';
}

/** Titre de la section sans l'en-tête de rubrique : « 🎓 AI Skill of the Day: X » → « X ». */
export function titreCompetence(titre) {
  const t = titre.trim();
  if (/^today.s prompt tip of the day/i.test(t)) return '';
  return t
    .replace(/^[^A-Za-z]*(NEW SECTION\s*:\s*)?/i, '')
    .replace(
      /^(AI Skill of the Day|[\w ]*?(Prompt|Agent|Operator|Skill) Tip of the (Day|Week)|Prompt Tip)\s*[.!:]?\s*/i,
      '',
    )
    .trim();
}

const contientH1 = (element) => element.tagName === 'H1' || Boolean(element.querySelector('h1'));

/** Blocs d'un élément qui suivent son intitulé (anciennes éditions : même conteneur). */
function blocsApresTitre(conteneur, titre, sortie) {
  if (conteneur === titre) return;
  let apres = false;
  for (const enfant of conteneur.childNodes) {
    if (!apres) {
      if (enfant === titre || (enfant.nodeType === 1 && enfant.contains(titre))) {
        apres = true;
        if (enfant !== titre) blocsApresTitre(enfant, titre, sortie);
      }
      continue;
    }
    if (enfant.nodeType === 1 && contientH1(enfant)) return;
    blocs(enfant, sortie);
  }
}

/**
 * Sections de la rubrique (« AI Skill of the Day » et ses anciens noms) d'une page, brute ou
 * archivée : [{ rubrique, titreOriginal, blocs: [{ t: 'p'|'ul'|'ol'|'pre'|'h'|'quote'|'table', x }] }].
 */
export function extraireCompetences(page) {
  const morceau = morceauCorps(page);
  if (!morceau || !/(skill of the day|tip of the (day|week)|prompt tip)/i.test(morceau)) return [];
  const corps = JSDOM.fragment(morceau).querySelector('#content-blocks');
  if (!corps) return [];
  const enfants = [...corps.children];
  const sections = [];
  for (let i = 0; i < enfants.length; i += 1) {
    const enfant = enfants[i];
    const titre = /^H[1-3]$/.test(enfant.tagName) ? enfant : enfant.querySelector('h1, h2, h3');
    const texteTitre = propre(titre?.textContent ?? '');
    if (!titre || !estRubrique(texteTitre)) continue;
    const morceaux = [];
    blocsApresTitre(enfant, titre, morceaux);
    let j = i + 1;
    for (; j < enfants.length; j += 1) {
      if (contientH1(enfants[j])) break;
      blocs(enfants[j], morceaux);
    }
    const contenu = [];
    for (const b of morceaux) {
      if (estFin(b)) break;
      contenu.push(b);
    }
    sections.push({
      rubrique: nomRubrique(texteTitre),
      titreOriginal: titreCompetence(texteTitre),
      blocs: contenu,
    });
    i = j - 1;
  }
  return sections;
}
