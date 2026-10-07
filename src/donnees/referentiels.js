/**
 * Référentiels : catégories, niveaux et outils. Les slugs servent dans les fiches
 * (src/donnees/fiches.js) et dans l'adresse de la page (?categorie=verifier).
 * Une catégorie par couleur de catégorie du design system Skazy Formation.
 */

export const CATEGORIES = [
  {
    slug: 'formuler',
    court: 'Formuler',
    nom: 'Formuler',
    description: 'Structurer une demande, donner le contexte, définir le résultat attendu.',
    couleur: 'vert',
    icone: 'pen-nib',
  },
  {
    slug: 'verifier',
    court: 'Vérifier',
    nom: 'Vérifier et sécuriser',
    description: 'Faire critiquer, prouver et contredire l’IA ; protéger ses données et ses accès.',
    couleur: 'rose',
    icone: 'shield-halved',
  },
  {
    slug: 'automatiser',
    court: 'Automatiser',
    nom: 'Agents et automatisation',
    description: 'Déléguer à un agent, planifier une tâche, enchaîner les étapes.',
    couleur: 'violet',
    icone: 'robot',
  },
  {
    slug: 'coder',
    court: 'Coder',
    nom: 'Coder avec l’IA',
    description: 'Méthodes pour Claude Code, Codex, Cursor et les autres agents de code.',
    couleur: 'bleu',
    icone: 'code',
  },
  {
    slug: 'memoire',
    court: 'Mémoire',
    nom: 'Mémoire et compétences',
    description: 'Instructions durables, mémoire, contexte et Skills réutilisables.',
    couleur: 'turquoise',
    icone: 'brain',
  },
  {
    slug: 'creer',
    court: 'Créer',
    nom: 'Images, vidéo et design',
    description: 'Visuels, vidéos, maquettes et mondes 3D générés par l’IA.',
    couleur: 'jaune',
    icone: 'palette',
  },
  {
    slug: 'business',
    court: 'Stratégie',
    nom: 'Stratégie et métier',
    description: 'Marketing, offres, veille concurrentielle et stratégie IA de l’entreprise.',
    couleur: 'orange',
    icone: 'briefcase',
  },
  {
    slug: 'outils',
    court: 'Outils',
    nom: 'Choisir ses outils',
    description: 'Le bon modèle pour la bonne tâche, les coûts, l’IA en local.',
    couleur: 'anthracite',
    icone: 'toolbox',
  },
];

export const NIVEAUX = [
  { slug: 'debutant', nom: 'Débutant', description: 'Dans n’importe quel chatbot, sans réglage.' },
  {
    slug: 'intermediaire',
    nom: 'Intermédiaire',
    description: 'Projets, fichiers joints, plusieurs échanges, fonctions avancées.',
  },
  {
    slug: 'avance',
    nom: 'Avancé',
    description: 'Agents, code, ligne de commande ou API.',
  },
];

/** Outils cités par les fiches. « tous » : la technique marche dans n'importe quel chatbot. */
export const OUTILS = [
  { slug: 'tous', nom: 'Tous les chatbots' },
  { slug: 'chatgpt', nom: 'ChatGPT' },
  { slug: 'claude', nom: 'Claude' },
  { slug: 'gemini', nom: 'Gemini' },
  { slug: 'copilot', nom: 'Copilot' },
  { slug: 'claude-code', nom: 'Claude Code' },
  { slug: 'codex', nom: 'Codex' },
  { slug: 'cursor', nom: 'Cursor' },
  { slug: 'autre', nom: 'Autres outils' },
];

export const TYPES_PROMPT = {
  prompt: 'Prompt',
  commande: 'Commande',
  fichier: 'Fichier',
};

export function categorie(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function niveau(slug) {
  return NIVEAUX.find((n) => n.slug === slug);
}

export function outil(slug) {
  return OUTILS.find((o) => o.slug === slug);
}
