# zid-downloader

Version gratuite et simple d’un gestionnaire de téléchargements et de conversion vidéo vers MP3.

## Vision du produit

Cette version abandonne la logique premium et se concentre sur un besoin direct et utile :

- télécharger des fichiers depuis une URL
- organiser les fichiers dans un dossier choisi par l’utilisateur
- suivre les téléchargements en temps réel
- convertir des vidéos en MP3 depuis une URL ou un lien vidéo
- garder une interface claire, légère et accessible

L’objectif n’est pas d’être un produit payant, mais un outil utile, gratuit et fonctionnel pour les utilisateurs qui veulent télécharger rapidement des fichiers ou extraire l’audio d’une vidéo.

## Fonctionnalités

- Ajout d’un téléchargement par URL
- Sélection du dossier de destination
- Suivi de progression et vitesse estimée
- Mise en pause, reprise et suppression
- File d’attente simple
- Persistance locale des tâches
- Conversion vidéo vers MP3 depuis une URL vidéo
- Interface desktop adaptative en thème clair / sombre

## Stack technique

- React + Vite + TypeScript
- Tauri 2 pour l’application desktop
- Lucide React pour les icônes réelles
- Vitest pour les tests de logique
- CSS personnalisé avec palette douce bleu ciel

## Structure du projet

```bash
Donwloader/
├── README.md
├── DESIGN.md
├── docs/
│   ├── 01-cahier-des-charges.md
│   ├── 02-diagrammes-uml.md
│   └── 03-plan-developpement.md
├── graphify-out/
├── zid-downloader/
│   ├── src/
│   ├── src-tauri/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
└── .gitignore
```

## Prérequis

- Node.js 18+
- npm
- Rust et Cargo pour la version desktop Tauri

## Démarrage rapide

```bash
cd zid-downloader
npm install

```

## Lancement de la version desktop

```bash
cd zid-downloader
npm install
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Tests

```bash
cd zid-downloader
npm test
```

## Build de production

```bash
cd zid-downloader
npm run build
```

## Règle de la version actuelle

Cette version cible un usage gratuit et immédiat :

- pas de licence
- pas de verrouillage premium
- uniquement téléchargement via URL et extraction audio depuis vidéo
- expérience simple et rapide pour les utilisateurs standards

## Statut

Version actuelle orientée gratuit, avec interface fonctionnelle, logique de file d’attente validée et base de conversion vidéo vers MP3 en préparation.
