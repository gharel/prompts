# Consignes : traduire des fiches « AI Skill of the Day » (The Neuron) en français

Tu produis des fiches pour la **Prompthèque de Skazy Formation** (organisme de formation à l'IA en Nouvelle-Calédonie). Chaque fiche présente une technique de prompt tirée de la rubrique « AI Skill of the Day » de la newsletter The Neuron, traduite et adaptée en français, avec le ou les prompts à copier.

Mode d’emploi pour intégrer de nouvelles éditions :

1. `npm run newsletters` archive les nouvelles éditions de The Neuron et écrit `archives/a-traduire.json` (les sections « AI Skill of the Day » qui n’ont pas encore de fiche).
2. Donnez ce fichier et ces consignes à Claude (par lots d’une vingtaine d’entrées) : il écrit un fichier JSON de fiches traduites.
3. `npm run integrer -- <fichier.json>` ajoute les fiches à `src/donnees/fiches.js`, avec la date et l’adresse de l’édition d’origine, et contrôle le schéma et la typographie.

## Entrée

Un fichier JSON : une liste d'objets `{ "cle", "date", "url", "newsletter", "rubrique", "titreOriginal", "blocs" }`. `date`, `url`, `newsletter` et `rubrique` situent l’édition d’origine (ne les recopiez pas : l’intégration les reprend des archives). La rubrique s’est appelée « Prompt Tip of the Week » (fin 2024), « Prompt Tip of the Day » (2025 à février 2026), puis « AI Skill of the Day » : c’est la même rubrique. `titreOriginal` peut être vide (les anciennes sections n’ont pas de titre). `blocs` est le texte original découpé : `p` (paragraphe, markdown léger), `ul`/`ol` (listes), `pre` (bloc de code ou prompt), `h` (intertitre), `quote`, `table`, `img` (capture d’écran liée : `x` est l’image, `lien` l’adresse ; tu ne peux pas la voir, sers-toi seulement du texte qui l’entoure et du lien).

## Sortie

Un fichier JSON (UTF-8, tableau, même ordre que l'entrée), un objet par entrée :

```json
{
  "cle": "copie exacte de la clé d'entrée",
  "titre": "Se faire interviewer par l’IA avant qu’elle écrive",
  "resume": "Une ou deux phrases (140 à 200 caractères) : ce que fait la technique et ce qu’elle apporte.",
  "categorie": "formuler",
  "niveau": "debutant",
  "outils": ["tous"],
  "corps": [
    {
      "t": "p",
      "x": "Paragraphe en markdown léger : **gras**, *italique*, [lien](https://…), `code`."
    },
    { "t": "liste", "x": ["Point", "Autre point"] },
    { "t": "etapes", "x": ["Étape 1", "Étape 2"] }
  ],
  "prompts": [
    {
      "titre": "Le prompt d’interview",
      "type": "prompt",
      "texte": "Texte complet du prompt, avec \n pour les retours à la ligne.",
      "adapte": false
    }
  ],
  "aRetenir": "Une phrase : l’idée clé à garder en tête.",
  "exclure": false
}
```

### Champs

- **titre** : commence par un **verbe à l’infinitif** (« Faire contredire… », « Vérifier… », « Découper… »), 70 caractères maximum, clair pour un non-spécialiste. Si l’original n’a pas de titre (`titreOriginal` vide), invente un titre fidèle au contenu.
- **resume** : 1 ou 2 phrases, 140 à 200 caractères, sans répéter le titre. Il s’affiche sur la carte.
- **categorie** : un seul slug parmi :
  - `formuler` : structurer un prompt, donner le contexte, définir « terminé », reformuler, se faire interviewer, mots-clés, symboles, explications.
  - `verifier` : faire critiquer, contredire, prouver ; éviter la complaisance (sycophancy) et les inventions ; vérifier chiffres et sources ; sécurité, permissions, données sensibles, garde-fous.
  - `automatiser` : agents, routines, tâches planifiées, délégation, workflows, boucles, briefs du matin, connecteurs (n8n, Zapier, Slack…).
  - `coder` : Claude Code, Codex, Cursor, agents de code, CLAUDE.md, revue de code, tests, git.
  - `memoire` : mémoire, instructions durables, contexte long, compaction, Skills, fichiers .md de contexte, projets, transfert d’historique.
  - `creer` : images, vidéo, design, maquettes, sites web visuels, 3D, voix.
  - `business` : marketing, contenus, offres commerciales, concurrence, visibilité (SEO, citations par les IA), stratégie IA de l’entreprise, dépendance à une plateforme.
  - `outils` : choisir un modèle ou un outil, comparer, réduire les coûts, IA en local (Gemma, Qwen…), entraîner un modèle, fonctions d’un produit (Gemini, Copilot…).
    Choisis la catégorie de **l’usage principal** de la fiche.
- **niveau** :
  - `debutant` : se fait dans n’importe quel chatbot en copiant le prompt ;
  - `intermediaire` : demande une fonction particulière (projet, fichiers, connecteur, Skill, tâche planifiée, mode agent dans l’interface) ou plusieurs échanges ;
  - `avance` : ligne de commande, agent de code, API, installation locale, configuration technique.
- **outils** : liste de slugs parmi `tous` (marche dans n’importe quel chatbot), `chatgpt`, `claude`, `gemini`, `copilot`, `claude-code`, `codex`, `cursor`, `autre` (tout autre outil nommé : NotebookLM compte comme `gemini`, Claude Cowork comme `claude`, vidIQ, LTX, Flow, Unsloth, Marble… comme `autre`). Mets `tous` seul si aucun outil précis n’est nécessaire.
- **corps** : l’explication traduite et adaptée, en 2 à 6 blocs. Types : `p` (paragraphe), `liste` (puces), `etapes` (liste numérotée, quand l’ordre compte). Garde les liens utiles de l’original (vers les auteurs, guides, outils) en markdown `[texte](url)` ; garde les crédits (« selon Andrej Karpathy », « l’avocat Niklas Schmidt explique… »). Ne mets pas le prompt dans le corps : il va dans `prompts`.
- **prompts** : chaque prompt, commande ou modèle de fichier de l’original, **traduit en entier** (pas de résumé).
  - `type` : `prompt` (texte à envoyer à une IA), `commande` (ligne de commande, à ne pas traduire), `fichier` (modèle de fichier, par exemple un CLAUDE.md ou une arborescence).
  - `titre` : court, nomme l’usage (« Le prompt contradicteur », « La commande d’installation »).
  - Un prompt peut aussi se trouver dans un paragraphe de l’original (phrase entre guillemets à copier) : sors-le en prompt.
  - Si l’original ne donne **aucun** prompt, écris **un** prompt court qui applique la technique et mets `"adapte": true`. Sinon `"adapte": false`.
- **aRetenir** : une phrase, l’idée clé (souvent le « favorite insight » ou « takeaway » de l’original).
- **exclure** : `true` seulement si l’entrée ne contient pas de technique utilisable : section vide, contenu uniquement dans une image, pure publicité ou annonce. Ajoute alors `"raison"` (une phrase) ; les autres champs peuvent rester vides. Une astuce courte mais exploitable (même un simple lien vers un guide, avec une phrase d’explication) n’est **pas** à exclure : fais-en une fiche, en t’appuyant sur ce que dit le texte.

## Style

- Français naturel et précis, pas de calque de l’anglais. Explications au **vouvoiement** (« Collez votre plan… »).
- Les prompts **tutoient l’IA** (« Tu es… », « Rédige… », « Donne-moi… ») et sont écrits comme l’utilisateur les taperait.
- Les éléments à compléter restent entre crochets et sont traduits en groupe nominal : `[votre plan, argument ou brouillon]`, `[tâche]`, `[critère de réussite]`.
- Balises XML des prompts : traduis le nom si c’est naturel (`<position>`, `<brouillon>`, `<email>`), garde la structure.
- **Ne traduis pas** : les commandes, noms de fichiers (`CLAUDE.md`, `SKILL.md`), noms de produits et de fonctions (Claude Code, Projects, Cowork, Gems, /goal, /compact), le code.
- Supprime l’autopromotion de The Neuron (livestreams, digest, « Total AI beginner? », « Request it here », partenaires) et les allusions à l’actualité du jour qui n’aident pas à appliquer la technique.
- Adapte, ne délaie pas : on peut condenser l’original, jamais inventer une affirmation, un chiffre ou une source. Pas de fioriture (« Et voilà ! », « Bonne nouvelle : »).
- **Typographie française** dans `titre`, `resume`, `corps`, `aRetenir` et dans les prompts de type `prompt` : apostrophe courbe ’ (jamais '), guillemets « » (jamais " ni “ ”), points de suspension …, **aucun emoji**. Exception : à l’intérieur du `code` en ligne, des commandes et des fichiers, garde les caractères d’origine.
- Les termes anglais courants en IA peuvent rester s’ils sont plus clairs (prompt, agent, chatbot, token), en italique la première fois si utile ; « sycophancy » se dit « complaisance ».

## Contrôle avant d’écrire le fichier

- JSON valide, même nombre d’objets que l’entrée, `cle` recopiée à l’identique.
- Aucun `'` ni `"` ni `“ ”` dans `titre`, `resume`, `corps`, `aRetenir` (hors code entre accents graves). Aucun emoji nulle part.
- Chaque fiche a au moins un prompt.
