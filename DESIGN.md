# DESIGN.md — zid-downloader

## 1. Vision de design

Le produit doit paraître calme, fiable, moderne et facile à lire. Le design évite les contrastes agressifs et privilégie une interface lumineuse, respirante, et pensée pour des sessions longues de téléchargement.

## 2. Palette de couleurs

### Palette principale
- Bleu ciel principal : #8EC9F5
- Bleu ciel profond : #5AA9E6
- Bleu marine doux : #234E70
- Blanc cassé : #F5FAFF
- Blanc : #FFFFFF
- Gris neutre : #E8EEF5
- Gris moyen : #8CA0B8
- Texte principal : #1B2A3A
- Texte secondaire : #4E657D

### Palette d'état
- Succès : #74C69D
- Attention : #F4C95D
- Erreur : #E76F51
- Info : #6BAED6

## 3. Thème clair et thème sombre

### Thème clair
- Fond principal : #F5FAFF
- Fond des cartes : #FFFFFF
- Bordures : #DCEAF5
- Surface active : #EAF6FF
- Accent : #8EC9F5
- Texte : #1B2A3A

### Thème sombre
- Fond principal : #0F1724
- Fond des cartes : #152332
- Bordures : #223548
- Surface active : #1C2D3F
- Accent : #8EC9F5
- Texte : #EAF3FF

La palette doit être utilisée avec une surcouche douce de contraste, ou avec des niveaux de gris plus clairs pour garder un rendu apaisé.

## 4. Typographie

- Police principale : Inter, Segoe UI, sans-serif
- Police de titres : Inter, Segoe UI, sans-serif
- Taille de base : 14px
- Titre principal : 28 à 32px
- Sous-titres : 18 à 22px
- Texte d'interface : 13 à 15px

Le texte doit être clair, lisible, sans surdensité et sans grands blocs denses.

## 5. Style visuel

### Composants
- Coins arrondis modérés : 12px à 18px
- Ombres très légères, douces et diffuses
- Bordures fines et discrètes
- Répartition d'espaces généreuse entre les lignes et les sections
- Contraste stable entre éléments actifs et éléments neutres

### Layout
- Structure simple en colonne ou en grille légère
- Utilisation de blancs et bleus clairs pour séparer les zones fonctionnelles
- Barres de progression discrètes avec teintes bleues
- Éléments de statut codés par couleur subtile sans surcharger

## 6. Direction de conception

- Aucun emoji dans l'interface ni dans le code
- Utiliser des icônes vectorielles réelles, par exemple Lucide SVG ou un jeu d'icônes SVG maisons, pas un set Spark ou un style décoratif non professionnalisé
- Prioriser le calme, la confiance et la lisibilité
- Éviter les couleurs saturées, les effets trop brillants et les contrastes trop forts
- Les thèmes clair et sombre doivent partager la même logique visuelle

## 7. Système d'icônes

- Choisir des icônes linéaires, géométriques et lisibles
- Utiliser des traits de largeur constante
- Les icônes doivent rester cohérentes avec les tailles de texte et les boutons
- Les plus utiles pour le produit : téléchargement, pause, reprise, dossier, historique, vidéo, horloge, paramètres, paquet, statut, recherche, sécurité, et verrouillage

## 8. Exemples de composants

### Bouton principal
- fond bleu ciel principal
- texte sombre ou blanc selon le thème
- hauteur de 36 à 42 px
- bordure très légère ou aucune bordure

### Carte de téléchargement
- fond blanc ou fond sombre discret
- bordure claire
- titre et statut alignés
- progression lisible en bleu doux
- icône à gauche pour l'état de la tâche

### Barre de statut
- progression avec teinte bleue douce
- texte de vitesse et temps restant discret
- hauteur compacte

## 9. Références de style souhaitées

- moderne sans être froid
- ergonomique sans être minimaliste au point de devenir neutre
- rassurant et professionnel
- adapté à un usage long et régulier sur poste de travail

## 10. Règles de la mise en œuvre

- les composants doivent conserver un espace respirant autour des blocs
- les états doivent être différenciés sans déclencher un effet visuel trop fort
- les éléments de navigation doivent rester clairement hiérarchisés
- la palette doit rester stable entre les écrans pour éviter la fatigue visuelle
- le design doit accepter les thèmes clair et sombre sans perdre sa cohérence

## 11. Exemple de token de design

```json
{
  "colors": {
    "primary": "#8EC9F5",
    "primaryStrong": "#5AA9E6",
    "primaryDeep": "#234E70",
    "background": "#F5FAFF",
    "surface": "#FFFFFF",
    "surfaceAlt": "#EAF6FF",
    "text": "#1B2A3A",
    "mutedText": "#4E657D",
    "border": "#DCEAF5",
    "success": "#74C69D",
    "warning": "#F4C95D",
    "danger": "#E76F51"
  },
  "radius": {
    "sm": "10px",
    "md": "14px",
    "lg": "18px"
  },
  "spacing": {
    "xs": "8px",
    "sm": "12px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  }
}
```

## 12. Conclusion

La direction visuelle de zid-downloader doit transmettre la fiabilité et le calme. Le bleu ciel est le bon point d'ancrage visuel, associé à des surfaces blanches et des gris doux pour créer une interface agréable à l'œil, apaisante, et adaptée aux modes clair et sombre.
