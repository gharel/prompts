# AGENTS.md : Prompthèque (Skazy Formation)

Consignes pour les agents de code (Claude Code, Codex, Copilot…) et pour les humains qui travaillent sur ce dépôt.

## Le projet

Une base de prompts en français : une fiche par section de la rubrique quotidienne de la newsletter **The Neuron** (theneurondaily.com), « AI Skill of the Day », appelée « Prompt Tip of the Week » fin 2024 puis « Prompt Tip of the Day » jusqu’au 2 mars 2026.

- Chaque fiche : titre, résumé, catégorie, niveau, outils, explication, un ou plusieurs prompts à copier, idée à retenir, **source datée** (édition, adresse, titre original, nom de la rubrique).
- **Aucune IA ni requête réseau dans la page.** Elle est livrée en **un seul fichier HTML autonome** (`dist/index.html`), ouvrable hors ligne, et publiée sur GitHub Pages : https://gharel.github.io/prompts/
- La charte est celle du design system **Skazy Formation** de Claude Design, reprise du projet voisin `exercices-ia` : vert `#50967c`, texte `#4a4a4a`, police Georama, boutons en pilule, cartes avec une barre de couleur de 6 px en haut, badges en majuscules, scène sombre `#1a1a1a`, pas d’emoji.
- Les **archives** (`archives/the-neuron/`) gardent toutes les éditions de la newsletter, pour en tirer d’autres informations plus tard.

## Commandes

| Commande                                | Rôle                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `npm install`                           | Installe les outils de développement **et les hooks git** (script `prepare`)           |
| `npx playwright install chromium`       | Installe le navigateur des tests e2e (une seule fois)                                  |
| `npm run dev`                           | Serveur local sur http://localhost:4184 (sources, sans build) + navigateur             |
| `npm run build`                         | Construit `dist/index.html`, le fichier unique autonome                                |
| `npm run newsletters`                   | Archive les nouvelles éditions de The Neuron, liste les sections à traduire            |
| `npm run integrer -- <traduction.json>` | Ajoute des fiches traduites à `src/donnees/fiches.js` (contrôle schéma + typographie)  |
| `npm run icones`                        | Régénère `src/js/icones-donnees.js` après un ajout dans `src/js/icones.js`             |
| `npm run check`                         | Lint + format + validation HTML + tests unitaires (**avant chaque commit**)            |
| `npm run test:e2e`                      | Build, puis tests Playwright de bout en bout, accessibilité et mobile (**avant push**) |
| `npm run captures`                      | Photographie la page (1280, 1920, 390, 360 px, clair et sombre) dans `captures/`       |

Les tests e2e portent sur le fichier construit, servi sur le port 4185 (`PORT_E2E` pour en changer).

**Agents : arrêtez toujours le serveur que vous lancez en arrière-plan.**

## Structure

```
src/index.html                 La page (gabarit) ; en dev, charge styles/*.css et js/main.js en modules
src/styles/charte.css          Jetons du design system (clair et sombre) : seul fichier où une couleur est écrite
src/styles/base.css            Mise en page, bandeau, boutons, champs, panneaux, toast, pied
src/styles/composants.css      Scène, pastilles, filtres, cartes, fiche, prompts, à propos
src/js/main.js                 Montage de la page, adresse (filtres et #fiche)
src/js/etat.js                 État : filtres, favoris, thème ; adresse ↔ filtres (pur)
src/js/filtres.js              Pur : rechercher, filtrer, trier, compter, voisines
src/js/texte.js                Pur : markdown léger, [passages à compléter], dates, slugs
src/js/schema.js               Schéma d'une fiche et contrôle de typographie
src/js/ui.js · stockage.js     el(), remplir(), typographier(), copier() ; seul accès à localStorage (préfixe skazy-prompts:)
src/js/icones.js               Liste des icônes Font Awesome utilisées ; icone('nom') ou icone('regular/nom')
src/js/vues/                   bandeau, scene, resultats, menu (filtres en pilule), carte, fiche, apropos, commun
src/donnees/referentiels.js    Catégories (une couleur du design system chacune), niveaux, outils
src/donnees/fiches.js          Les fiches, écrites par npm run integrer
archives/the-neuron/           Toutes les éditions archivées + index.json (date, source, récupération)
outils/neuron.js               Lecture des pages de The Neuron : nettoyer(), extraireCompetences()
outils/newsletters.js          npm run newsletters
outils/integrer-fiches.js      npm run integrer
outils/consignes-traduction.md Consignes de traduction à donner à Claude
outils/                        dev.js, construire.js (build), generer-icones.js, captures.js
tests/unit/                    Vitest : logique pure, extraction, contrôle de toutes les fiches
tests/e2e/                     Playwright : parcours, accessibilité (axe), mobile, fichier en file://
```

## Les fiches

- On ne modifie pas `src/donnees/fiches.js` à la main pour ajouter des fiches : on passe par `npm run integrer`, qui les relie à leur édition archivée (date, adresse, titre) par leur `cle` (le slug de l’édition). Pour corriger une fiche, on peut la modifier directement, ou réintégrer une traduction corrigée de même `cle` (elle remplace l’ancienne et garde son identifiant).
- Le schéma est en tête de `src/js/schema.js` ; les règles de rédaction sont dans `outils/consignes-traduction.md` :
  - titre qui commence par un verbe à l’infinitif ; explications au vouvoiement ; prompts qui tutoient l’IA, `[crochets]` pour ce que l’utilisateur complète ;
  - typographie française : apostrophe ’, guillemets « », points de suspension …, aucun emoji ; une espace ordinaire avant ? ! ; : suffit (l’affichage la rend insécable) ;
  - un prompt rédigé par Skazy Formation (l’original n’en donnait pas) porte `adapte: true` et l’interface le signale.
- `npx vitest run tests/unit/donnees.test.js` contrôle toutes les fiches.

## Conventions de code

Reprises des projets voisins `jeu-formation` et `exercices-ia`, même auteur et même charte :

- **En français** : noms de fonctions et de variables, commentaires, textes affichés, messages de commit.
- **Aucune dépendance à l'exécution, aucun CDN, aucune requête réseau.** La police est intégrée, les icônes Font Awesome Free sont un sprite SVG généré (`npm run icones`). esbuild ne sert qu'à construire le fichier unique. jsdom sert aux outils d’archives (Node).
- **La logique est séparée de l'affichage.** Les fonctions pures (`filtres.js`, `texte.js`, `etat.js`, `schema.js`, `outils/neuron.js`) sont testées unitairement ; les vues ne font que construire la page et réagir aux clics.
- **Sécurité** : tout texte passe par `el()` ou `textContent`, jamais par `innerHTML` ; les liens du markdown léger n’acceptent que `http(s)`.
- **Stockage** : toujours par `stockage.js` ; une erreur de stockage ne fait jamais planter la page.
- **Accessibilité** :
  - contraste WCAG AA dans les deux thèmes : pas de texte blanc sur `#50967c` (3,5:1), on utilise `--primaire-fonce` ;
  - tout se fait au clavier (← → dans une fiche, Échap pour fermer), les annonces passent par `annoncer()` ;
  - `prefers-reduced-motion` est respecté ;
- **Téléphone** : aucun défilement horizontal, aucun texte coupé, aucun bouton qui touche un texte, à 390 et 360 px (`tests/e2e/mobile.spec.js` le vérifie).
- **Format** : Prettier (guillemets simples, 100 colonnes). Lint : ESLint `recommended` + `eqeqeq`, `prefer-const`.

## Procédure avant commit et push

1. `npm run check` passe sans erreur (en cas d'échec de format : `npm run format`).
2. `npm run test:e2e` passe entièrement.
3. Si l'interface a changé : `npm run captures`, puis vérification à l'œil (1280, 1920, 390 et 360 px, clair et sombre).
4. Commit au format Conventional Commits, en français : `feat(fiche): …`, `fix(filtres): …`, `docs:`, `test:`, `chore:`, `data:` pour de nouvelles fiches.
5. Push sur `main` : [.github/workflows/publier.yml](.github/workflows/publier.yml) relance les tests, construit `dist/index.html` et le publie sur GitHub Pages. Un push sur `main` est une mise en ligne.

Interdits : `--no-verify`, supprimer ou assouplir un test pour le faire passer.
