// Thème choisi, commun à tous les outils Skazy Formation, appliqué avant l'affichage pour
// éviter un éclair de la mauvaise couleur. Thème du système : aucune clé.
// Script classique (pas un module), chargé dans le <head> : il s'exécute avant l'affichage.
// Le build le recopie en ligne dans dist/index.html, autorisé par son empreinte dans la
// politique de sécurité (Content-Security-Policy) : pas de script en ligne dans src/index.html.
try {
  const theme = JSON.parse(localStorage.getItem('skazy-outils:theme'));
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // stockage indisponible : thème du système
}
