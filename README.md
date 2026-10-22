# zid-downloader

Application de bureau pour gérer les téléchargements avec une interface claire, une file d’attente simple et un système de destination de fichiers local.

## Objectif

zid-downloader vise à offrir une expérience de téléchargement plus lisible et plus légère qu’un navigateur classique, avec :

- ajout de téléchargements par URL
- suivi de progression
- file d’attente avec priorité de tâches
- mise en pause / reprise
- choix du dossier de destination
- persistance locale de l’état
- préparation pour l’intégration native Tauri

## Stack technique

- React + Vite + TypeScript
- Tauri 2
- Lucide React pour les icônes
- Vitest pour les tests unitaires
- CSS personnalisé pour l’interface

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
- Rust et Cargo (pour le mode desktop Tauri)

## Lancer le projet

Depuis le dossier du projet frontend :

```bash
cd zid-downloader
npm install
npm run dev
```

Pour le mode desktop Tauri :

```bash
cd zid-downloader
npm install
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Tester

```bash
cd zid-downloader
npm test
```

## Build de production

```bash
cd zid-downloader
npm run build
```

## Notes de développement

- Les tâches sont stockées localement pour garder l’état entre les sessions.
- La file d’attente est gérée par logique interne avec un nombre maximal de téléchargements actifs.
- Le projet est conçu pour évoluer vers un vrai moteur de téléchargement réel côté desktop, en respectant les spécifications du cahier des charges.

## Statut

Version de travail en cours de développement, avec interface fonctionnelle et logique de file d’attente validée.
