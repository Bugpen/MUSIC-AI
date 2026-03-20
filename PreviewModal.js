import { renderLyrics, collectLyrics } from "./LyricsViewer.js";
import { createSyncEngine } from "./SyncEngine.js";
import { initAudioPlayer } from "./AudioPlayer.js";
import { db, doc, updateDoc } from "./firebase.js";

export function createPreviewModal() {
  const modalEl = document.getElementById("previewModal");
  const titleEl = document.getElementById("previewTitle");
  const metaEl = document.getElementById("previewMeta");
  const closeBtn = document.getElementById("previewClose");
  const editBtn = document.getElementById("previewEdit");
  const saveBtn = document.getElementById("previewSave");
  const lyricsEl = document.getElementById("previewLyrics");
  const audioEl = document.getElementById("previewAudio");
  const playBtn = document.getElementById("previewPlay");
  const prevBtn = document.getElementById("previewPrev");
  const nextBtn = document.getElementById("previewNext");
  const repeatBtn = document.getElementById("previewRepeat");
  const moreBtn = document.getElementById("previewMore");
  const menuEl = document.getElementById("previewMenu");
  const seekEl = document.getElementById("previewSeek");
  const currentEl = document.getElementById("previewCurrent");
  const durationEl = document.getElementById("previewDuration");
  const volumeEl = document.getElementById("previewVolume");
  const speedEl = document.getElementById("previewSpeed");

  const player = initAudioPlayer({
    audioEl,
    playBtn,
    seekEl,
    currentEl,
    durationEl,
    volumeEl,
    prevBtn,
    nextBtn,
    repeatBtn,
    menuBtn: moreBtn,
    menuEl,
    speedEl,
    onPrev: () => {
      audioEl.currentTime = 0;
    },
    onNext: () => {
      audioEl.currentTime = 0;
    },
  });

  let currentSong = null;
  let syncEngine = null;
  let lineEls = [];
  let isEditing = false;
  let tempUrlToRevoke = "";

  const normalizeLyrics = (lyrics) =>
    (lyrics || []).map((line) => ({
      time: Number(line.time) || 0,
      text: String(line.text || "").trim(),
    }));

  const open = (song) => {
    if (!song) return;
    currentSong = song;
    isEditing = false;
    editBtn.textContent = "Edit Lyrics";
    lyricsEl.classList.remove("editing");
    saveBtn.disabled = !song.id;
    saveBtn.title = song.id ? "" : "Upload song to Firebase to enable saving.";

    titleEl.textContent = song.title || "Song Preview";
    metaEl.textContent = song.artist ? `by ${song.artist}` : "";
    if (!song.id) {
      metaEl.textContent = `${metaEl.textContent} · Not uploaded yet`.trim();
    }

    const lyrics = normalizeLyrics(song.lyrics || []).sort(
      (a, b) => a.time - b.time
    );
    if (!lyrics.length) {
      lyricsEl.innerHTML = "<div class=\"preview-line\">No lyrics yet.</div>";
      lineEls = [];
    } else {
      lineEls = renderLyrics(lyricsEl, lyrics, { editable: false });
    }

    if (syncEngine) syncEngine.destroy();
    syncEngine = createSyncEngine({
      audioEl,
      lyrics,
      lineEls,
      containerEl: lyricsEl,
    });

    if (tempUrlToRevoke) {
      URL.revokeObjectURL(tempUrlToRevoke);
      tempUrlToRevoke = "";
    }
    if (song.__tempUrl) {
      tempUrlToRevoke = song.__tempUrl;
    }
    player.setSource(song.audioUrl || "");
    modalEl.classList.remove("hidden");
  };

  const close = () => {
    modalEl.classList.add("hidden");
    audioEl.pause();
    if (syncEngine) syncEngine.destroy();
    if (tempUrlToRevoke) {
      URL.revokeObjectURL(tempUrlToRevoke);
      tempUrlToRevoke = "";
    }
  };

  const toggleEdit = () => {
    if (!currentSong) return;
    isEditing = !isEditing;
    editBtn.textContent = isEditing ? "Stop Editing" : "Edit Lyrics";
    audioEl.pause();
    playBtn.textContent = "Play";
    lyricsEl.classList.toggle("editing", isEditing);

    const lyrics = normalizeLyrics(currentSong.lyrics || []);
    if (syncEngine) {
      syncEngine.destroy();
      syncEngine = null;
    }
    lineEls = renderLyrics(lyricsEl, lyrics, { editable: isEditing });
    if (!isEditing) {
      syncEngine = createSyncEngine({
        audioEl,
        lyrics,
        lineEls,
        containerEl: lyricsEl,
      });
    }
  };

  const save = async () => {
    if (!currentSong || !isEditing || !currentSong.id) return;
    const updated = collectLyrics(lyricsEl)
      .filter((line) => line.text)
      .sort((a, b) => a.time - b.time);
    try {
      await updateDoc(doc(db, "songs", currentSong.id), {
        lyrics: updated,
      });
      currentSong.lyrics = updated;
      isEditing = false;
      editBtn.textContent = "Edit Lyrics";
      lineEls = renderLyrics(lyricsEl, updated, { editable: false });
      if (syncEngine) syncEngine.destroy();
      syncEngine = createSyncEngine({
        audioEl,
        lyrics: updated,
        lineEls,
        containerEl: lyricsEl,
      });
    } catch (err) {
      console.error(err);
    }
  };

  closeBtn.addEventListener("click", close);
  modalEl.addEventListener("click", (event) => {
    if (event.target && event.target.dataset.previewClose) {
      close();
    }
  });
  document.addEventListener("click", (event) => {
    if (!menuEl.classList.contains("open")) return;
    if (event.target.closest(".more")) return;
    menuEl.classList.remove("open");
  });
  editBtn.addEventListener("click", toggleEdit);
  saveBtn.addEventListener("click", save);

  return { open, close };
}
