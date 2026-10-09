/**
 * Seul point d'accès à localStorage. Toutes les clés sont préfixées par « skazy-prompts: », sauf
 * celle du thème, commune à tous les outils Skazy Formation (CLE_THEME, en fin de fichier).
 * Les erreurs (navigation privée, quota dépassé, stockage bloqué) ne font jamais planter la page.
 */

const PREFIXE = 'skazy-prompts:';

function zone() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function lire(cle, defaut = null) {
  try {
    const brut = zone()?.getItem(PREFIXE + cle);
    return brut === null || brut === undefined ? defaut : JSON.parse(brut);
  } catch {
    return defaut;
  }
}

/** Renvoie true si l'écriture a réussi. */
export function ecrire(cle, valeur) {
  try {
    const z = zone();
    if (!z) return false;
    z.setItem(PREFIXE + cle, JSON.stringify(valeur));
    return true;
  } catch {
    return false;
  }
}

/**
 * Prévient quand une autre page (l’outil ouvert dans un autre onglet) change cette clé.
 * Renvoie une fonction pour arrêter d'écouter.
 */
export function ecouterStockage(cle, fonction) {
  const ecouteur = (evenement) => {
    if (evenement.key === PREFIXE + cle || evenement.key === null) fonction();
  };
  globalThis.addEventListener?.('storage', ecouteur);
  return () => globalThis.removeEventListener?.('storage', ecouteur);
}

export function effacer(cle) {
  try {
    zone()?.removeItem(PREFIXE + cle);
  } catch {
    // rien à faire : le stockage est indisponible
  }
}

/**
 * Le thème est commun à tous les outils Skazy Formation : publiés à la même origine
 * (https://gharel.github.io), ils partagent ce stockage, donc une seule clé, sans le préfixe de
 * l'outil. Elle vaut "light" ou "dark" (en JSON) pour un thème choisi ; le thème du système
 * l'efface. Les anciennes clés propres à chaque outil ne sont plus lues.
 */
export const CLE_THEME = 'skazy-outils:theme';

/** Thème choisi : 'light', 'dark', ou 'systeme' (clé absente, valeur inconnue, stockage bloqué). */
export function lireTheme() {
  try {
    const theme = JSON.parse(zone()?.getItem(CLE_THEME) ?? 'null');
    return theme === 'light' || theme === 'dark' ? theme : 'systeme';
  } catch {
    return 'systeme';
  }
}

/** Retient le thème pour tous les outils ; le thème du système efface la clé. True si c'est fait. */
export function ecrireTheme(theme) {
  try {
    const z = zone();
    if (!z) return false;
    if (theme === 'light' || theme === 'dark') z.setItem(CLE_THEME, JSON.stringify(theme));
    else z.removeItem(CLE_THEME);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prévient, avec le thème relu, quand il a pu changer ailleurs : dans un autre onglet ou un autre
 * outil (événement storage), ou au retour sur une page gardée en mémoire par le navigateur
 * (pageshow). Renvoie une fonction pour arrêter d'écouter.
 */
export function ecouterTheme(fonction) {
  const surStockage = (evenement) => {
    if (evenement.key === CLE_THEME || evenement.key === null) fonction(lireTheme());
  };
  const surRetour = (evenement) => {
    if (evenement.persisted) fonction(lireTheme());
  };
  globalThis.addEventListener?.('storage', surStockage);
  globalThis.addEventListener?.('pageshow', surRetour);
  return () => {
    globalThis.removeEventListener?.('storage', surStockage);
    globalThis.removeEventListener?.('pageshow', surRetour);
  };
}
