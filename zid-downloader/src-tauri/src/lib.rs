use std::fs::File;
use std::path::PathBuf;
use std::process::Command;

fn ensure_parent_directory(file_path: &PathBuf) -> Result<(), String> {
  if let Some(parent) = file_path.parent() {
    if !parent.as_os_str().is_empty() {
      std::fs::create_dir_all(parent).map_err(|error| format!("Impossible de créer le dossier : {error}"))?;
    }
  }

  Ok(())
}

fn download_to_file(url: &str, file_path: &PathBuf) -> Result<(), String> {
  ensure_parent_directory(file_path)?;

  let response = reqwest::blocking::get(url)
    .map_err(|error| format!("Téléchargement impossible : {error}"))?;

  if !response.status().is_success() {
    return Err(format!("Réponse HTTP {}", response.status()));
  }

  let mut file = File::create(file_path)
    .map_err(|error| format!("Impossible d'écrire le fichier : {error}"))?;

  let mut body = response;
  std::io::copy(&mut body, &mut file)
    .map_err(|error| format!("Erreur de lecture du flux : {error}"))?;

  Ok(())
}

fn ffmpeg_available() -> bool {
  Command::new("ffmpeg").arg("-version").output().is_ok()
}

#[tauri::command]
fn download_file(url: String, path: String) -> Result<String, String> {
  let file_path = PathBuf::from(&path);
  download_to_file(&url, &file_path)?;
  Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn download_and_convert_to_mp3(url: String, path: String) -> Result<String, String> {
  let file_path = PathBuf::from(&path);

  if !ffmpeg_available() {
    return Err("FFmpeg n'est pas disponible sur cette machine. Installez FFmpeg pour convertir une vidéo en MP3.".to_string());
  }

  let temp_path = file_path.with_extension(".download");
  download_to_file(&url, &temp_path)?;

  let status = Command::new("ffmpeg")
    .arg("-y")
    .arg("-i")
    .arg(&temp_path)
    .arg("-vn")
    .arg("-ar")
    .arg("44100")
    .arg("-ac")
    .arg("2")
    .arg("-b:a")
    .arg("192k")
    .arg(&file_path)
    .status()
    .map_err(|error| format!("Impossible de lancer FFmpeg : {error}"))?;

  let _ = std::fs::remove_file(&temp_path);

  if !status.success() {
    return Err("La conversion vidéo vers MP3 a échoué.".to_string());
  }

  Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![download_file, download_and_convert_to_mp3])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
