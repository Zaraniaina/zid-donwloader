# zid-downloader

Gestionnaire de téléchargements desktop en Tauri 2 + React. Télécharge une URL vers un dossier choisi, ou extrait l'audio d'un fichier vidéo en MP3.

## Prérequis

- Node 18 ou plus
- Rust stable (cargo)
- FFmpeg dans le PATH pour la conversion MP3 (`winget install Gyan.FFmpeg`)
- WebView2 sur Windows (déjà présent sur Windows 10 et 11)

## Démarrage en mode desktop

```bash
cd zid-downloader
npm install
npm run tauri dev
```

La première compilation Rust prend quelques minutes. La fenêtre s'ouvre ensuite avec le rechargement à chaud du frontend.

## Build de production

```bash
npm run tauri build
```

L'installeur NSIS sort dans `src-tauri/target/release/bundle/nsis/`. Pour vérifier seulement la compilation sans créer l'installeur :

```bash
npm run tauri build -- --no-bundle
```

## Vérifications

```bash
npm run check                                  # TypeScript, tests front, ESLint
cargo test --manifest-path src-tauri/Cargo.toml
```

## Fonctionnement réel

- Le transfert HTTP se fait côté Rust en streaming, avec temporaire `.part` et renommage à la fin.
- La progression, la vitesse et le temps restant viennent d'événements émis par Rust toutes les 300 ms.
- Pause annule le transfert et supprime le fichier partiel. Reprendre repart du début : il n'y a pas encore de reprise par `Range`.
- Un fichier existant n'est jamais écrasé, un suffixe `(1)` est ajouté.
- La conversion MP3 utilise FFmpeg, sortie 192 kbps.

## Limites connues

- Une seule tâche active à la fois. Les suivantes attendent dans la file.
- Seules les URL directes sont acceptées (`http` et `https`). Une page YouTube renvoie du HTML et la conversion échoue.
- Pas de reprise après coupure : le fichier repart de zéro.
