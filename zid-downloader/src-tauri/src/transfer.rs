use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

use crate::media;

pub const CANCELLED: &str = "__cancelled__";
const PROGRESS_INTERVAL: Duration = Duration::from_millis(300);

#[derive(Default)]
pub struct Transfers {
    active: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressEvent {
    id: String,
    downloaded: u64,
    total: u64,
    bytes_per_second: f64,
}

#[derive(Clone, Serialize)]
struct PhaseEvent {
    id: String,
    phase: String,
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("zid-downloader/0.1")
        .connect_timeout(Duration::from_secs(15))
        .read_timeout(Duration::from_secs(45))
        .build()
        .map_err(|error| format!("Client HTTP indisponible : {error}"))
}

pub fn validate_url(value: &str) -> Result<(), String> {
    let parsed = reqwest::Url::parse(value.trim())
        .map_err(|_| "Cette adresse n'est pas une URL valide.".to_string())?;

    match parsed.scheme() {
        "http" | "https" => Ok(()),
        _ => Err("Seules les adresses http et https sont acceptées.".to_string()),
    }
}

pub fn unique_path(path: &Path) -> PathBuf {
    if !path.exists() {
        return path.to_path_buf();
    }

    let parent = path.parent().map(Path::to_path_buf).unwrap_or_default();
    let stem = path.file_stem().and_then(|value| value.to_str()).unwrap_or("fichier");
    let extension = path.extension().and_then(|value| value.to_str());

    for index in 1..=999 {
        let candidate = match extension {
            Some(extension) => parent.join(format!("{stem} ({index}).{extension}")),
            None => parent.join(format!("{stem} ({index})")),
        };

        if !candidate.exists() {
            return candidate;
        }
    }

    path.to_path_buf()
}

fn part_path(target: &Path) -> PathBuf {
    let mut name = target
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("fichier")
        .to_string();
    name.push_str(".part");
    target.with_file_name(name)
}

pub async fn fetch_to_file(
    client: &reqwest::Client,
    url: &str,
    target: &Path,
    cancel: &AtomicBool,
    mut on_progress: impl FnMut(u64, u64, f64),
) -> Result<PathBuf, String> {
    let mut response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("Connexion impossible : {error}"))?;

    let status = response.status();
    if !status.is_success() {
        return Err(match status.as_u16() {
            401 | 403 => format!("Le serveur a refusé l'accès ({status})."),
            404 => "Fichier introuvable sur le serveur (404).".to_string(),
            _ => format!("Le serveur a répondu {status}."),
        });
    }

    let total = response.content_length().unwrap_or(0);

    if let Some(parent) = target.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|error| format!("Dossier impossible à créer : {error}"))?;
    }

    let part = part_path(target);
    let mut file = tokio::fs::File::create(&part)
        .await
        .map_err(|error| format!("Écriture impossible : {error}"))?;

    let started = Instant::now();
    let mut downloaded = 0_u64;
    let mut last_emit = Instant::now();

    loop {
        if cancel.load(Ordering::Relaxed) {
            drop(file);
            let _ = tokio::fs::remove_file(&part).await;
            return Err(CANCELLED.to_string());
        }

        let chunk = match response.chunk().await {
            Ok(Some(chunk)) => chunk,
            Ok(None) => break,
            Err(error) => {
                drop(file);
                let _ = tokio::fs::remove_file(&part).await;
                return Err(format!("Transfert interrompu : {error}"));
            }
        };

        if let Err(error) = file.write_all(&chunk).await {
            drop(file);
            let _ = tokio::fs::remove_file(&part).await;
            return Err(format!("Écriture impossible : {error}"));
        }

        downloaded += chunk.len() as u64;

        if last_emit.elapsed() >= PROGRESS_INTERVAL {
            let elapsed = started.elapsed().as_secs_f64().max(0.001);
            on_progress(downloaded, total, downloaded as f64 / elapsed);
            last_emit = Instant::now();
        }
    }

    file.flush()
        .await
        .map_err(|error| format!("Écriture impossible : {error}"))?;
    drop(file);

    if total > 0 && downloaded != total {
        let _ = tokio::fs::remove_file(&part).await;
        return Err(format!(
            "Fichier incomplet : {downloaded} octets reçus sur {total}."
        ));
    }

    let final_path = unique_path(target);
    tokio::fs::rename(&part, &final_path)
        .await
        .map_err(|error| format!("Renommage impossible : {error}"))?;

    let elapsed = started.elapsed().as_secs_f64().max(0.001);
    on_progress(downloaded, total, downloaded as f64 / elapsed);

    Ok(final_path)
}

fn register(state: &Transfers, id: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    state
        .active
        .lock()
        .expect("verrou des transferts")
        .insert(id.to_string(), flag.clone());
    flag
}

fn unregister(state: &Transfers, id: &str) {
    state
        .active
        .lock()
        .expect("verrou des transferts")
        .remove(id);
}

#[tauri::command]
pub fn cancel_download(state: State<'_, Transfers>, id: String) {
    if let Some(flag) = state
        .active
        .lock()
        .expect("verrou des transferts")
        .get(&id)
    {
        flag.store(true, Ordering::Relaxed);
    }
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    state: State<'_, Transfers>,
    id: String,
    url: String,
    path: String,
) -> Result<String, String> {
    validate_url(&url)?;

    let cancel = register(&state, &id);
    let result = download_with_events(&app, &id, &url, PathBuf::from(path), &cancel).await;
    unregister(&state, &id);

    result
}

async fn download_with_events(
    app: &AppHandle,
    id: &str,
    url: &str,
    target: PathBuf,
    cancel: &AtomicBool,
) -> Result<String, String> {
    let client = client()?;
    let event_id = id.to_string();
    let handle = app.clone();

    let final_path = fetch_to_file(&client, url, &target, cancel, move |downloaded, total, speed| {
        let _ = handle.emit(
            "transfer://progress",
            ProgressEvent {
                id: event_id.clone(),
                downloaded,
                total,
                bytes_per_second: speed,
            },
        );
    })
    .await?;

    Ok(final_path.to_string_lossy().to_string())
}

const VIDEO_PAGE_DOMAINS: &[&str] = &[
    "youtube.com",
    "youtu.be",
    "vimeo.com",
    "dailymotion.com",
    "tiktok.com",
    "soundcloud.com",
    "twitch.tv",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "reddit.com",
];

pub fn is_video_page(url: &str) -> bool {
    let Ok(parsed) = reqwest::Url::parse(url) else {
        return false;
    };

    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return false;
    }

    let Some(host) = parsed.host_str() else {
        return false;
    };

    let host = host.to_ascii_lowercase();
    VIDEO_PAGE_DOMAINS
        .iter()
        .any(|domain| host == *domain || host.ends_with(&format!(".{domain}")))
}

pub fn parse_size_token(token: &str) -> Option<f64> {
    let token = token.trim().trim_start_matches('~');
    let lower = token.to_ascii_lowercase();

    let (number, multiplier) = if let Some(rest) = lower.strip_suffix("kib") {
        (rest, 1024.0)
    } else if let Some(rest) = lower.strip_suffix("mib") {
        (rest, 1024.0 * 1024.0)
    } else if let Some(rest) = lower.strip_suffix("gib") {
        (rest, 1024.0 * 1024.0 * 1024.0)
    } else if let Some(rest) = lower.strip_suffix("kb") {
        (rest, 1000.0)
    } else if let Some(rest) = lower.strip_suffix("mb") {
        (rest, 1_000_000.0)
    } else if let Some(rest) = lower.strip_suffix("gb") {
        (rest, 1_000_000_000.0)
    } else if let Some(rest) = lower.strip_suffix('b') {
        (rest, 1.0)
    } else {
        return None;
    };

    number
        .trim()
        .parse::<f64>()
        .ok()
        .map(|value| value * multiplier)
}

pub fn parse_ytdlp_progress(line: &str) -> Option<(f64, f64, f64)> {
    let line = line.trim();
    if !line.starts_with("[download]") {
        return None;
    }

    let tokens: Vec<&str> = line.split_whitespace().collect();
    let percent = tokens
        .iter()
        .find(|token| token.ends_with('%'))?
        .trim_end_matches('%')
        .parse::<f64>()
        .ok()?;

    let total = tokens
        .iter()
        .position(|token| *token == "of")
        .and_then(|index| tokens.get(index + 1))
        .and_then(|token| parse_size_token(token))?;

    let speed = tokens
        .iter()
        .position(|token| *token == "at")
        .and_then(|index| tokens.get(index + 1))
        .and_then(|token| parse_size_token(token))
        .unwrap_or(0.0);

    Some((total * percent / 100.0, total, speed))
}

async fn run_ytdlp(
    url: &str,
    dest_dir: &Path,
    cancel: &AtomicBool,
    mut on_progress: impl FnMut(u64, u64, f64),
    mut on_convert: impl FnMut(),
) -> Result<String, String> {
    tokio::fs::create_dir_all(dest_dir)
        .await
        .map_err(|error| format!("Dossier impossible à créer : {error}"))?;

    let template = format!("{}\\%(title)s.%(ext)s", dest_dir.display());

    let mut child = tokio::process::Command::new("yt-dlp")
        .args(["-x", "--audio-format", "mp3", "--audio-quality", "192K"])
        .args(["--newline", "--no-playlist", "--no-simulate"])
        .args(["--print", "after_move:filepath"])
        .arg("-o")
        .arg(&template)
        .arg(url)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| format!("yt-dlp n'a pas pu démarrer : {error}"))?;

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Sortie de yt-dlp indisponible.".to_string())?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Erreurs de yt-dlp indisponibles.".to_string())?;

    let stderr_task = tokio::spawn(async move {
        let mut buffer = Vec::new();
        let _ = tokio::io::copy(&mut stderr, &mut buffer).await;
        buffer
    });

    let mut final_path: Option<String> = None;
    let mut last_emit = Instant::now();
    let mut lines = BufReader::new(&mut stdout).lines();

    loop {
        let line = tokio::select! {
            next = lines.next_line() => match next {
                Ok(Some(line)) => line,
                Ok(None) => break,
                Err(error) => return Err(format!("Lecture de yt-dlp impossible : {error}")),
            },
            _ = tokio::time::sleep(Duration::from_millis(250)) => {
                if cancel.load(Ordering::Relaxed) {
                    let _ = child.start_kill();
                    return Err(CANCELLED.to_string());
                }
                continue;
            }
        };

        if let Some((downloaded, total, speed)) = parse_ytdlp_progress(&line) {
            if last_emit.elapsed() >= PROGRESS_INTERVAL {
                on_progress(downloaded as u64, total as u64, speed);
                last_emit = Instant::now();
            }
            continue;
        }

        if line.starts_with("[ExtractAudio]") {
            on_convert();
            continue;
        }

        let candidate = line.trim();
        if candidate.to_ascii_lowercase().ends_with(".mp3") && Path::new(candidate).is_absolute() {
            final_path = Some(candidate.to_string());
        }
    }

    let status = child
        .wait()
        .await
        .map_err(|error| format!("yt-dlp interrompu : {error}"))?;
    let stderr_text = String::from_utf8_lossy(&stderr_task.await.unwrap_or_default()).to_string();

    if cancel.load(Ordering::Relaxed) {
        return Err(CANCELLED.to_string());
    }

    if !status.success() {
        let detail = stderr_text
            .lines()
            .rev()
            .find(|line| !line.trim().is_empty())
            .map(|line| line.trim().trim_start_matches("ERROR: ").to_string())
            .unwrap_or_else(|| "yt-dlp n'a pas pu traiter cette adresse.".to_string());

        return Err(format!("Conversion impossible : {detail}"));
    }

    final_path
        .filter(|candidate| Path::new(candidate).exists())
        .ok_or_else(|| "yt-dlp n'a pas produit de fichier MP3.".to_string())
}

#[tauri::command]
pub async fn download_and_convert_to_mp3(
    app: AppHandle,
    state: State<'_, Transfers>,
    id: String,
    url: String,
    path: String,
) -> Result<String, String> {
    validate_url(&url)?;
    media::ensure_ffmpeg()?;

    let cancel = register(&state, &id);

    let result = if is_video_page(&url) {
        match media::ensure_yt_dlp() {
            Ok(()) => {
                let dest_dir = Path::new(&path)
                    .parent()
                    .filter(|parent| !parent.as_os_str().is_empty())
                    .map(Path::to_path_buf)
                    .unwrap_or_else(|| PathBuf::from("."));

                convert_page_with_events(&app, &id, &url, &dest_dir, &cancel).await
            }
            Err(error) => Err(error),
        }
    } else {
        convert_with_events(&app, &id, &url, Path::new(&path), &cancel).await
    };

    unregister(&state, &id);

    result
}

async fn convert_page_with_events(
    app: &AppHandle,
    id: &str,
    url: &str,
    dest_dir: &Path,
    cancel: &AtomicBool,
) -> Result<String, String> {
    let event_id = id.to_string();
    let progress_handle = app.clone();
    let phase_handle = app.clone();

    run_ytdlp(
        url,
        dest_dir,
        cancel,
        move |downloaded, total, speed| {
            let _ = progress_handle.emit(
                "transfer://progress",
                ProgressEvent {
                    id: event_id.clone(),
                    downloaded,
                    total,
                    bytes_per_second: speed,
                },
            );
        },
        move || {
            let _ = phase_handle.emit(
                "transfer://phase",
                PhaseEvent {
                    id: id.to_string(),
                    phase: "convert".to_string(),
                },
            );
        },
    )
    .await
}

async fn convert_with_events(
    app: &AppHandle,
    id: &str,
    url: &str,
    target: &Path,
    cancel: &AtomicBool,
) -> Result<String, String> {
    let client = client()?;
    let event_id = id.to_string();
    let handle = app.clone();

    let source = fetch_to_file(
        &client,
        url,
        &target.with_extension("source"),
        cancel,
        move |downloaded, total, speed| {
            let _ = handle.emit(
                "transfer://progress",
                ProgressEvent {
                    id: event_id.clone(),
                    downloaded,
                    total,
                    bytes_per_second: speed,
                },
            );
        },
    )
    .await?;

    let _ = app.emit(
        "transfer://phase",
        PhaseEvent {
            id: id.to_string(),
            phase: "convert".to_string(),
        },
    );

    let output_path = unique_path(target);
    let output = tokio::process::Command::new("ffmpeg")
        .args(["-hide_banner", "-loglevel", "error", "-y", "-i"])
        .arg(&source)
        .args(["-vn", "-c:a", "libmp3lame", "-b:a", "192k"])
        .arg(&output_path)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::piped())
        .output()
        .await
        .map_err(|error| format!("FFmpeg n'a pas pu démarrer : {error}"))?;

    let _ = tokio::fs::remove_file(&source).await;

    if !output.status.success() {
        let _ = tokio::fs::remove_file(&output_path).await;
        let detail = String::from_utf8_lossy(&output.stderr);
        let line = detail
            .lines()
            .next()
            .unwrap_or("format non pris en charge")
            .trim()
            .to_string();

        return Err(format!("Conversion impossible : {line}"));
    }

    Ok(output_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};
    use std::net::TcpListener;

    fn serve_once(body: &'static [u8]) -> u16 {
        let listener = TcpListener::bind("127.0.0.1:0").expect("port libre");
        let port = listener.local_addr().expect("adresse locale").port();

        std::thread::spawn(move || {
            if let Ok((mut stream, _)) = listener.accept() {
                let mut request = [0_u8; 1024];
                let _ = stream.read(&mut request);
                let head = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    body.len()
                );
                let _ = stream.write_all(head.as_bytes());
                let _ = stream.write_all(body);
            }
        });

        port
    }

    fn serve_slow_stream() -> u16 {
        let listener = TcpListener::bind("127.0.0.1:0").expect("port libre");
        let port = listener.local_addr().expect("adresse locale").port();

        std::thread::spawn(move || {
            if let Ok((mut stream, _)) = listener.accept() {
                let mut request = [0_u8; 1024];
                let _ = stream.read(&mut request);
                let _ = stream.write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: 67108864\r\n\r\n",
                );
                let block = vec![7_u8; 64 * 1024];
                for _ in 0..1024 {
                    if stream.write_all(&block).is_err() {
                        break;
                    }
                    std::thread::sleep(Duration::from_millis(2));
                }
            }
        });

        port
    }

    fn temp_dir(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "zid-downloader-{label}-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).expect("dossier temporaire");
        dir
    }

    #[tokio::test]
    async fn writes_the_complete_response_body() {
        let body: &'static [u8] = b"contenu de test";
        let port = serve_once(body);
        let dir = temp_dir("download");
        let target = dir.join("fichier.txt");
        let cancel = AtomicBool::new(false);
        let client = client().expect("client http");

        let written = fetch_to_file(
            &client,
            &format!("http://127.0.0.1:{port}/fichier.txt"),
            &target,
            &cancel,
            |_, _, _| {},
        )
        .await
        .expect("téléchargement");

        assert_eq!(written, target);
        assert_eq!(std::fs::read(&target).expect("lecture"), body);
        assert!(!target.with_file_name("fichier.txt.part").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn cancelling_leaves_no_file_behind() {
        let port = serve_once(b"abc");
        let dir = temp_dir("cancel");
        let target = dir.join("fichier.txt");
        let cancel = AtomicBool::new(true);
        let client = client().expect("client http");

        let error = fetch_to_file(
            &client,
            &format!("http://127.0.0.1:{port}/fichier.txt"),
            &target,
            &cancel,
            |_, _, _| {},
        )
        .await
        .expect_err("annulation attendue");

        assert_eq!(error, CANCELLED);
        assert!(!target.exists());
        assert!(!target.with_file_name("fichier.txt.part").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn cancelling_mid_stream_cleans_up() {
        let port = serve_slow_stream();
        let dir = temp_dir("midstream");
        let target = dir.join("gros.bin");
        let client = client().expect("client http");
        let cancel = Arc::new(AtomicBool::new(false));

        let url = format!("http://127.0.0.1:{port}/gros.bin");
        let task_target = target.clone();
        let task_cancel = cancel.clone();

        let handle = tokio::spawn(async move {
            fetch_to_file(&client, &url, &task_target, &task_cancel, |_, _, _| {}).await
        });

        tokio::time::sleep(Duration::from_millis(150)).await;
        cancel.store(true, Ordering::Relaxed);

        let error = handle
            .await
            .expect("tâche de téléchargement")
            .expect_err("annulation attendue");

        assert_eq!(error, CANCELLED);
        assert!(!target.exists());
        assert!(!target.with_file_name("gros.bin.part").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn unique_path_keeps_existing_files() {
        let dir = temp_dir("unique");
        let target = dir.join("archive.zip");
        std::fs::write(&target, b"x").expect("écriture");

        let candidate = unique_path(&target);

        assert_eq!(candidate, dir.join("archive (1).zip"));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn only_http_urls_are_accepted() {
        assert!(validate_url("https://example.com/file.zip").is_ok());
        assert!(validate_url("http://example.com/file.zip").is_ok());
        assert!(validate_url("file:///etc/passwd").is_err());
        assert!(validate_url("javascript:alert(1)").is_err());
        assert!(validate_url("pas une url").is_err());
    }

    #[test]
    fn detects_video_pages_and_direct_files() {
        assert!(is_video_page("https://youtu.be/lG6YOguMWKg"));
        assert!(is_video_page("https://www.youtube.com/watch?v=lG6YOguMWKg"));
        assert!(is_video_page("https://vimeo.com/12345"));
        assert!(!is_video_page("https://example.com/video.mp4"));
        assert!(!is_video_page("https://youtube.com.example.org/watch"));
    }

    #[test]
    fn reads_ytdlp_progress_lines() {
        let (downloaded, total, speed) =
            parse_ytdlp_progress("[download]  45.3% of 10.00MiB at 1.50MiB/s ETA 00:05")
                .expect("ligne de progression");

        assert!((total - 10.0 * 1024.0 * 1024.0).abs() < 1.0);
        assert!((downloaded - total * 0.453).abs() < 1.0);
        assert!((speed - 1.5 * 1024.0 * 1024.0).abs() < 1.0);

        assert!(parse_ytdlp_progress("[ExtractAudio] Converting audio from webm to mp3").is_none());
        assert!(parse_ytdlp_progress("[download] Destination: C:\\temp\\video.webm").is_none());
    }
}
