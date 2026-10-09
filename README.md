# Prompthèque · Skazy Formation

Les techniques de prompt de la rubrique quotidienne de la newsletter [The Neuron](https://www.theneurondaily.com), « **AI Skill of the Day** » (appelée « Prompt Tip of the Day » jusqu’en février 2026), **traduites en français**, classées par catégorie et prêtes à copier.

**En ligne : https://gharel.github.io/prompts/**

- une fiche par astuce du jour : la technique, le ou les prompts à copier (passages `[à compléter]` surlignés), l’idée à retenir, la source datée avec le lien vers l’article original ;
- 8 catégories (Formuler, Vérifier et sécuriser, Agents et automatisation, Coder avec l’IA, Mémoire et compétences, Images, vidéo et design, Stratégie et métier, Choisir ses outils), filtres par niveau et par outil, recherche sans accents, tri ;
- favoris gardés dans le navigateur, lien direct vers chaque fiche, filtres dans l’adresse ;
- charte du design system **Skazy Formation** (Claude Design), thème clair et sombre, pensé pour le téléphone ;
- chaque outil Skazy Formation a sa couleur de l’arc-en-ciel, dans cet ordre : Quiz rouge, Mini-jeux orange, Vigie jaune, Atelier d’exercices IA vert, Comprendre l'IA bleu, Prompthèque violet ; le favicon (pictogramme blanc sur un dégradé de cette couleur) sert aussi de pastille dans le bandeau ; titre d’onglet : « Page · Nom · Skazy Formation » ;
- un bandeau commun aux outils Skazy Formation : à gauche, la pastille et le nom de l’outil (un lien vers son accueil) ; à droite, après Mes favoris, À propos et le thème, « Les outils » (la roue, vers [la page des outils](https://gharel.github.io/home/)), un filet, puis le logo Skazy Formation (vers formation.skazy.nc, dans un nouvel onglet) ; sur téléphone, « Les outils » se réduit à la roue ; un bouton rond « Remonter en haut de la page » apparaît après un écran de défilement, sur ordinateur comme sur téléphone ;
- thème : le bouton du thème passe du thème du système au thème clair, puis sombre ; le choix vaut pour tous les outils Skazy Formation (clé `skazy-outils:theme` du navigateur) et s’applique aussitôt dans les autres onglets ouverts ; la page porte `<meta name="darkreader-lock" />` : elle a son propre thème sombre, et le mode nuit de Brave (Dark Reader) ne la repeint pas, même en thème clair ;
- un seul fichier HTML autonome (`dist/index.html`), sans aucune requête réseau, publié sur GitHub Pages.

## Les archives de The Neuron

`archives/the-neuron/` garde **toutes les éditions** de la newsletter (1 118 au 7 octobre 2026, de janvier 2023 à octobre 2026), une page HTML par édition, rangée par année : `archives/the-neuron/2026/2026-10-02-<slug>.html`. Chaque page garde le corps complet de l’édition (sans styles ni pisteurs) et, dans son `<head>`, sa **date de publication**, son **adresse source** et sa **date de récupération**.

`archives/the-neuron/index.json` les liste toutes : `slug`, `date`, `titre`, `sousTitre`, `url`, `fichier`, `recupereLe`.

## Ajouter les nouvelles éditions

```bash
npm run newsletters
```

1. Le script lit le plan du site, télécharge les éditions absentes des archives (une à la fois, avec une pause) et les archive avec leur date et leur source.
2. Il écrit `archives/a-traduire.json` : les sections « AI Skill of the Day » qui n’ont pas encore de fiche.
3. Faites traduire ce fichier par Claude en lui donnant [outils/consignes-traduction.md](outils/consignes-traduction.md) (par lots d’une vingtaine d’entrées). Il rend un fichier JSON de fiches.
4. Intégrez-le :

```bash
npm run integrer -- chemin/vers/traduction.json
```

Les fiches rejoignent `src/donnees/fiches.js` avec la date, l’adresse et le titre de l’édition d’origine. Le schéma et la typographie sont contrôlés ; une erreur arrête tout. Ensuite : `npm run check`, commit et push : la mise en ligne est automatique.

## Développer

```bash
npm install
npx playwright install chromium
npm run dev
```

Voir [AGENTS.md](AGENTS.md) pour la structure, les conventions et la procédure avant commit.

## Sources et droits

Les contenus sont traduits et adaptés de The Neuron (theneurondaily.com) ; chaque fiche cite son édition et renvoie à l’article original. The Neuron n’est pas associé à Skazy Formation. Icônes : Font Awesome Free (CC BY 4.0). Police : Georama (SIL OFL).
