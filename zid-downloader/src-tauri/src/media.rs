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
