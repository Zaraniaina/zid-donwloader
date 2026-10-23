use std::process::{Command, Stdio};
use std::sync::OnceLock;

static AVAILABLE: OnceLock<bool> = OnceLock::new();

pub fn ffmpeg_available() -> bool {
    *AVAILABLE.get_or_init(|| {
        Command::new("ffmpeg")
            .arg("-version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false)
    })
}

pub fn ensure_ffmpeg() -> Result<(), String> {
    if ffmpeg_available() {
        Ok(())
    } else {
        Err(
            "FFmpeg est introuvable. Installez-le (winget install Gyan.FFmpeg) puis relancez l'application."
                .to_string(),
        )
    }
}

#[tauri::command]
pub fn check_ffmpeg() -> bool {
    ffmpeg_available()
}

static YTDLP: OnceLock<bool> = OnceLock::new();

pub fn yt_dlp_available() -> bool {
    *YTDLP.get_or_init(|| {
        Command::new("yt-dlp")
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false)
    })
}

pub fn ensure_yt_dlp() -> Result<(), String> {
    if yt_dlp_available() {
        Ok(())
    } else {
        Err(
            "yt-dlp est introuvable. Installez-le (winget install yt-dlp.yt-dlp) puis relancez l'application."
                .to_string(),
        )
    }
}

#[tauri::command]
pub fn check_yt_dlp() -> bool {
    yt_dlp_available()
}
