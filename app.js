import {
  db,
  storage,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
} from "./firebase.js";
import { extractTextFromPdf, splitLyricsLines } from "./pdfParser.js";
import { createPreviewModal } from "./PreviewModal.js";
import { lyricsCatalog } from "../frontend/lyricsCatalog.js";

const ADMIN_KEY = "NewRuiruMediaKey2025!";
const CLOUDINARY_CLOUD_NAME = "dmzykxjoj";
const CLOUDINARY_UPLOAD_PRESET = "music_upload";

const statusEl = document.getElementById("status");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const albumEl = document.getElementById("album");
const genreEl = document.getElementById("genre");
const languageEl = document.getElementById("language");
const yearEl = document.getElementById("year");
const audioFileEl = document.getElementById("audioFile");
const coverFileEl = document.getElementById("coverFile");
const pdfFileEl = document.getElementById("pdfFile");
const parsePdfBtn = document.getElementById("parsePdf");
const loadTextBtn = document.getElementById("loadText");
const uploadCloudinaryBtn = document.getElementById("uploadCloudinary");
const lyricsTextEl = document.getElementById("lyricsText");
const lyricsTableEl = document.getElementById("lyricsTable");
const addLineBtn = document.getElementById("addLine");
const setTimeBtn = document.getElementById("setTime");
const autoTimestampBtn = document.getElementById("autoTimestamp");
const saveSongBtn = document.getElementById("saveSong");
const saveMetadataBtn = document.getElementById("saveMetadata");
const audioPreview = document.getElementById("audioPreview");

const folderListEl = document.getElementById("folderList");
const folderSearchEl = document.getElementById("folderSearch");
const folderMetaEls = document.querySelectorAll("[data-folder-meta]");
const uploadedListEl = document.getElementById("uploadedList");
const refreshButtons = document.querySelectorAll("[data-refresh]");
const savedAudioListEl = document.getElementById("savedAudioList");
const savedAudioCountEls = document.querySelectorAll("[data-audio-count]");

const stepPanels = document.querySelectorAll(".step-panel");
const stepButtons = document.querySelectorAll("[data-step-target]");
const stepPrevBtn = document.getElementById("stepPrev");
const stepNextBtn = document.getElementById("stepNext");
const openUploadFlowBtn = document.getElementById("openUploadFlow");
const jumpToUploadBtn = document.getElementById("jumpToUpload");
const globalMenuToggle = document.getElementById("globalMenuToggle");
const globalMenu = document.getElementById("globalMenu");
const previewSongTitleEl = document.getElementById("previewSongTitle");
const previewSongArtistEl = document.getElementById("previewSongArtist");
const previewLyricsCountEl = document.getElementById("previewLyricsCount");

let lyrics = [];
let selectedIndex = -1;
let audioDuration = 0;

const pendingUploads = new Map();
let activeSongNo = null;
const previewModal = createPreviewModal();

const lyricsByNo = new Map(lyricsCatalog.map((item) => [item.no, item.lines]));

const songCatalog = [
  { no: 1, title: "SOMA ZEFANIA" },
  { no: 2, title: "YASHUA MASIHI ALIENDA" },
  { no: 3, title: "NINATAMANI" },
  { no: 4, title: "YAHSHUA MESSIAH BWANA WETU" },
  { no: 5, title: "SIKU MOJA" },
  { no: 6, title: "MAISHA YANGU YOTE" },
  { no: 7, title: "KITABU CHA ISAIA" },
  { no: 8, title: "PAULO ALIYETUMWA" },
  { no: 9, title: "TUSOMENI ZABURI" },
  { no: 10, title: "ZABURI HAMSINI NA MOJA" },
  { no: 11, title: "YOHANA TATU" },
  { no: 12, title: "MWISHO WA DUNIA" },
  { no: 13, title: "DUNIANI" },
  { no: 14, title: "ULIPAA" },
  { no: 15, title: "HAMA WE" },
  { no: 16, title: "NINA FURAHA" },
  { no: 17, title: "SIKU ZAJA" },
  { no: 18, title: "NIKITAFAKARI" },
  { no: 19, title: "NATANGAZA JINA" },
  { no: 20, title: "ZAYUNI NINAUTAMANI" },
  { no: 21, title: "SIKU YA KURUDI" },
  { no: 22, title: "SOMA ZABURI MIA MOJA" },
  { no: 23, title: "TAZAMA MBINGU NA NCHI" },
  { no: 24, title: "KAMA WEWE UMEPATA NENO" },
  { no: 25, title: "SIKIENI HABARI YA MWISHO" },
  { no: 26, title: "ELOHIM MUNGU WA YAKOBO" },
  { no: 27, title: "TAZAMENI PENDO" },
  { no: 28, title: "WAEFESO MLANGO WA PILI" },
  { no: 29, title: "KAMA NDEGE WAMWIMBIAVYO" },
  { no: 30, title: "TUIMBE WIMBO" },
  { no: 31, title: "SOMENI UFUNUO ISHIRINI" },
  { no: 32, title: "YULE YOHANA" },
  { no: 33, title: "YOHANA MTUME" },
  { no: 34, title: "BASI NDUGU ZANGU" },
  { no: 35, title: "BWANA MUNGU AKASEMA" },
  { no: 36, title: "TWAINGOJEA SIKU YA BWANA" },
  { no: 37, title: "ELOHIM BABA MWENYEZI" },
  { no: 38, title: "FADHILI ZA BWANA" },
  { no: 39, title: "DUNIANI KUNA GIZA (PRAISE OR PRAYERS)" },
  { no: 40, title: "JIANDAENI KUJA MASIHI" },
  { no: 41, title: "KATIKA UFUNUO" },
  { no: 42, title: "PETERO LISHA KONDOO WANGU" },
  { no: 43, title: "PETERO WA YOHANA" },
  { no: 44, title: "SOMENI EZEKIELI 5:5" },
  { no: 45, title: "AYUBU 1:1" },
  { no: 46, title: "UAMINIFU WA BWANA" },
  { no: 47, title: "UKIANGALIA DUNIA HII" },
  { no: 48, title: "BINTI WA ZAYUNI" },
  { no: 49, title: "ELOHIM AKUPENDA" },
  { no: 50, title: "TAZAMENI MAAJABU" },
  { no: 51, title: "EE BWANA" },
  { no: 52, title: "TUTAKAPOFIKA ZAYUNI" },
  { no: 53, title: "ABARIKIWE BWANA" },
  { no: 54, title: "YAHSHUA NI NGOME" },
  { no: 55, title: "YAHSHUA YU MWEMA" },
];

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
}

let currentStep = 1;
const totalSteps = stepPanels.length || 1;

const setStep = (step) => {
  currentStep = Math.min(Math.max(step, 1), totalSteps);
  stepPanels.forEach((panel) => {
    const panelStep = Number(panel.dataset.step);
    panel.classList.toggle("active", panelStep === currentStep);
  });
  stepButtons.forEach((button) => {
    const target = Number(button.dataset.stepTarget);
    button.classList.toggle("active", target === currentStep);
  });
  if (stepPrevBtn) stepPrevBtn.disabled = currentStep === 1;
  if (stepNextBtn) {
    stepNextBtn.textContent = currentStep === totalSteps ? "Finish" : "Next";
  }
};

const scrollToUpload = () => {
  const uploadSection = document.getElementById("uploadFlow");
  if (uploadSection) {
    uploadSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  setStep(1);
};

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setStep(Number(button.dataset.stepTarget));
  });
});

if (stepPrevBtn) {
  stepPrevBtn.addEventListener("click", () => {
    setStep(currentStep - 1);
  });
}

if (stepNextBtn) {
  stepNextBtn.addEventListener("click", () => {
    if (currentStep < totalSteps) {
      setStep(currentStep + 1);
      return;
    }
    scrollToUpload();
  });
}

if (openUploadFlowBtn) {
  openUploadFlowBtn.addEventListener("click", scrollToUpload);
}
if (jumpToUploadBtn) {
  jumpToUploadBtn.addEventListener("click", scrollToUpload);
}

if (globalMenuToggle && globalMenu) {
  globalMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    globalMenu.classList.toggle("open");
  });
}

document.addEventListener("click", (event) => {
  if (!globalMenu || !globalMenu.classList.contains("open")) return;
  if (event.target.closest(".kebab")) return;
  globalMenu.classList.remove("open");
});

const setStatus = (text, tone = "default") => {
  statusEl.textContent = text;
  statusEl.style.color =
    tone === "error" ? "#ff6b6b" : tone === "success" ? "#68f5c4" : "#68f5c4";
};

const setFolderMeta = (text) => {
  folderMetaEls.forEach((el) => {
    el.textContent = text;
  });
};

const setAudioCount = (text) => {
  savedAudioCountEls.forEach((el) => {
    el.textContent = text;
  });
};

const updateUploadPreview = () => {
  if (!previewSongTitleEl || !previewSongArtistEl || !previewLyricsCountEl) {
    return;
  }
  previewSongTitleEl.textContent = titleEl.value.trim() || "Ready to upload";
  previewSongArtistEl.textContent = artistEl.value.trim() || "Add metadata first";
  const fallbackCount = normalizeLines(
    splitLyricsLines(lyricsTextEl.value || "")
  ).length;
  const count = lyrics.length || fallbackCount;
  previewLyricsCountEl.textContent = `${count} lines`;
};

const renderLyricsTable = () => {
  lyricsTableEl.innerHTML = "";

  lyrics.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = `row${index === selectedIndex ? " selected" : ""}`;

    const timeInput = document.createElement("input");
    timeInput.type = "number";
    timeInput.min = "0";
    timeInput.step = "0.1";
    timeInput.value = Number.isFinite(line.time) ? line.time : 0;
    timeInput.addEventListener("change", (e) => {
      lyrics[index].time = Number(e.target.value);
    });

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = line.text || "";
    textInput.addEventListener("input", (e) => {
      lyrics[index].text = e.target.value;
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      lyrics.splice(index, 1);
      if (selectedIndex === index) selectedIndex = -1;
      renderLyricsTable();
    });

    row.addEventListener("click", () => {
      selectedIndex = index;
      renderLyricsTable();
    });

    row.append(timeInput, textInput, removeBtn);
    lyricsTableEl.appendChild(row);
  });

  updateUploadPreview();
};

const loadLyricsFromLines = (lines) => {
  lyrics = lines.map((line) => ({
    time: 0,
    text: line,
  }));
  selectedIndex = -1;
  renderLyricsTable();
};

const uploadAudioToCloudinary = async (file, { timeoutMs = 45000 } = {}) => {
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
    throw new Error("Set your Cloudinary cloud name in admin/app.js");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  console.log("Cloudinary upload starting:", {
    endpoint,
    name: file.name,
    size: file.size,
    type: file.type,
  });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    console.log("Sending request to Cloudinary...");
    response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Cloudinary upload timed out.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json();
  console.log("Cloudinary response:", payload);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Cloudinary upload failed");
  }

  if (!payload.secure_url) {
    throw new Error("Cloudinary response missing secure_url");
  }

  return payload;
};

const normalizeLines = (lines) =>
  lines.filter(
    (line) =>
      line.length > 0 &&
      !/^\d+$/.test(line) &&
      !/table of contents/i.test(line)
  );

const buildLyricsFromCatalog = (songNo) => {
  const lines = lyricsByNo.get(songNo) || [];
  return lines.map((line, index) => ({
    time: Number((index * 2.5).toFixed(2)),
    text: line,
  }));
};

const findSongNo = (title) => {
  const normalized = (title || "").trim().toLowerCase();
  if (!normalized) return null;
  const match = songCatalog.find(
    (song) => song.title.toLowerCase() === normalized
  );
  return match ? match.no : null;
};

const findExistingSongDoc = async (songNo) => {
  if (typeof songNo !== "number") return null;
  const songsRef = collection(db, "songs");
  const q = query(songsRef, where("no", "==", songNo), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0];
};

const findSongDocByTitleArtist = async (title, artist) => {
  if (!title || !artist) return null;
  const songsRef = collection(db, "songs");
  const q = query(
    songsRef,
    where("title", "==", title),
    where("artist", "==", artist),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0];
};

const buildPreviewSong = (song) => {
  const pendingFile = pendingUploads.get(song.no);
  const tempUrl = pendingFile ? URL.createObjectURL(pendingFile) : "";
  return {
    id: null,
    no: song.no,
    title: song.title,
    artist: "COGMERS",
    audioUrl: tempUrl,
    lyrics: buildLyricsFromCatalog(song.no),
    __tempUrl: tempUrl,
  };
};

const renderFolder = () => {
  const term = (folderSearchEl.value || "").trim().toLowerCase();
  const filtered = songCatalog.filter((song) => {
    if (!term) return true;
    return (
      song.title.toLowerCase().includes(term) ||
      song.no.toString().includes(term)
    );
  });

  folderListEl.innerHTML = "";
  filtered.forEach((song) => {
    const row = document.createElement("div");
    row.className = "song-row";
    row.addEventListener("click", () => {
      previewModal.open(buildPreviewSong(song));
    });

    const cover = document.createElement("div");
    cover.className = "song-cover";
    cover.textContent = song.no.toString().padStart(2, "0");

    const numEl = document.createElement("div");
    numEl.className = "song-index";
    numEl.textContent = `#${song.no.toString().padStart(2, "0")}`;

    const titleCell = document.createElement("div");
    titleCell.className = "song-title";
    titleCell.textContent = song.title;

    const metaCell = document.createElement("div");
    metaCell.className = "song-meta";
    metaCell.textContent = "COGMERS";

    const statusCell = document.createElement("div");
    statusCell.className = "song-status";
    const selectedFile = pendingUploads.get(song.no);
    statusCell.textContent = selectedFile
      ? `Selected: ${selectedFile.name}`
      : "Pending audio";
    if (selectedFile) statusCell.classList.add("ready");

    const actionBtn = document.createElement("button");
    actionBtn.className = "song-action";
    actionBtn.textContent = selectedFile ? "Replace Audio" : "Upload Audio";
    actionBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      activeSongNo = song.no;
      titleEl.value = song.title;
      if (!artistEl.value.trim()) {
        artistEl.value = "COGMERS";
      }
      updateUploadPreview();
      setStatus(`Choose audio for ${song.title}`);
      audioFileEl.click();
    });

    row.append(cover, numEl, titleCell, metaCell, statusCell, actionBtn);
    folderListEl.appendChild(row);
  });

  setFolderMeta(
    `${songCatalog.length} songs · ${pendingUploads.size} audio selected`
  );
};

const renderUploadedSongs = (songs) => {
  uploadedListEl.innerHTML = "";
  if (!songs.length) {
    uploadedListEl.innerHTML =
      "<div class=\"empty-state\">No uploaded songs yet.</div>";
    return;
  }

  songs.forEach((song) => {
    const row = document.createElement("div");
    row.className = "uploaded-item";
    row.addEventListener("click", () => previewModal.open(song));

    const cover = document.createElement("div");
    cover.className = "song-cover";
    const coverUrl = song.coverUrl || song.coverImage || song.coverImageUrl || "";
    if (coverUrl) {
      cover.style.backgroundImage = `url(${coverUrl})`;
      cover.classList.add("has-image");
    } else {
      cover.textContent = (song.title || "S")[0].toUpperCase();
    }

    const info = document.createElement("div");
    info.className = "song-info";
    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = song.title || "Untitled";
    const meta = document.createElement("div");
    meta.className = "song-meta";
    meta.textContent = song.artist || "Unknown artist";
    info.append(title, meta);

    const status = document.createElement("div");
    status.className = "song-status";
    status.textContent = song.audioUrl ? "Audio ready" : "Audio missing";

    row.append(cover, info, status);
    uploadedListEl.appendChild(row);
  });
};

const renderSavedAudio = (songs) => {
  if (!savedAudioListEl) return;
  savedAudioListEl.innerHTML = "";

  const audioOnly = songs.filter((song) => song.audioUrl);
  setAudioCount(`${audioOnly.length} tracks`);

  if (!audioOnly.length) {
    savedAudioListEl.innerHTML =
      "<div class=\"empty-state\">No audio uploaded yet.</div>";
    return;
  }

  audioOnly.forEach((song) => {
    const row = document.createElement("div");
    row.className = "uploaded-item";
    row.addEventListener("click", () => previewModal.open(song));

    const cover = document.createElement("div");
    cover.className = "song-cover";
    const coverUrl = song.coverUrl || song.coverImage || song.coverImageUrl || "";
    if (coverUrl) {
      cover.style.backgroundImage = `url(${coverUrl})`;
      cover.classList.add("has-image");
    } else {
      cover.textContent = (song.title || "S")[0].toUpperCase();
    }

    const info = document.createElement("div");
    info.className = "song-info";
    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = song.title || "Untitled";
    const meta = document.createElement("div");
    meta.className = "song-meta";
    meta.textContent = song.artist || "Unknown artist";
    info.append(title, meta);

    const status = document.createElement("div");
    status.className = "song-status";
    status.textContent = "Audio ready";

    row.append(cover, info, status);
    savedAudioListEl.appendChild(row);
  });
};

const loadUploadedSongs = async () => {
  try {
    const songsRef = collection(db, "songs");
    const q = query(songsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const songs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    renderUploadedSongs(songs);

    const musicRef = collection(db, "MusicSongs");
    const mq = query(musicRef, orderBy("createdAt", "desc"));
    const musicSnap = await getDocs(mq);
    const musicSongs = musicSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    renderSavedAudio(musicSongs);
  } catch (err) {
    console.error(err);
    uploadedListEl.innerHTML = "<p class=\"sub\">Failed to load songs.</p>";
    if (savedAudioListEl) {
      savedAudioListEl.innerHTML = "<p class=\"sub\">Failed to load songs.</p>";
    }
    setAudioCount("0 tracks");
  }
};

parsePdfBtn.addEventListener("click", async () => {
  if (!pdfFileEl.files[0]) {
    setStatus("Please choose a PDF file first.", "error");
    return;
  }

  try {
    setStatus("Extracting text from PDF...");
    const rawText = await extractTextFromPdf(pdfFileEl.files[0]);
    const lines = normalizeLines(splitLyricsLines(rawText));
    lyricsTextEl.value = lines.join("\n");
    loadLyricsFromLines(lines);
    setStatus(`PDF extracted: ${lines.length} lines`, "success");
  } catch (err) {
    setStatus("Failed to parse PDF.", "error");
    console.error(err);
  }
});

loadTextBtn.addEventListener("click", () => {
  const lines = normalizeLines(splitLyricsLines(lyricsTextEl.value || ""));
  loadLyricsFromLines(lines);
  setStatus(`Loaded ${lines.length} lines from text.`, "success");
});

titleEl.addEventListener("input", updateUploadPreview);
artistEl.addEventListener("input", updateUploadPreview);
lyricsTextEl.addEventListener("input", updateUploadPreview);

const handleUpload = async () => {
  const audioFile = audioFileEl.files[0];
  if (!audioFile) {
    setStatus("Choose an audio file first.", "error");
    return;
  }

  const title = titleEl.value.trim();
  const artist = artistEl.value.trim();
  if (!title || !artist) {
    setStatus("Title and artist are required.", "error");
    return;
  }

  try {
    uploadCloudinaryBtn.disabled = true;
    uploadCloudinaryBtn.textContent = "Uploading...";
    console.log("Upload started.");
    setStatus("Uploading audio to Cloudinary...");

    // Step A: Cloudinary upload
    const cloudinaryData = await uploadAudioToCloudinary(audioFile);
    console.log("Cloudinary Response:", cloudinaryData);

    const secureUrl = cloudinaryData.secure_url;
    console.log("Cloudinary secure_url:", secureUrl);

    // Step B: Optional cover upload
    let coverImage = "";
    if (coverFileEl.files[0]) {
      const coverFile = coverFileEl.files[0];
      const coverRef = ref(
        storage,
        `musicSongs/covers/${Date.now()}-${coverFile.name}`
      );
      const coverSnap = await uploadBytes(coverRef, coverFile, {
        customMetadata: { adminKey: ADMIN_KEY },
      });
      coverImage = await getDownloadURL(coverSnap.ref);
    }

    let cleanedLyrics = lyrics
      .filter((line) => line.text && line.text.trim().length > 0)
      .map((line) => ({
        time: Number(line.time) || 0,
        text: line.text.trim(),
      }))
      .sort((a, b) => a.time - b.time);

    if (!cleanedLyrics.length) {
      const lines = normalizeLines(splitLyricsLines(lyricsTextEl.value || ""));
      cleanedLyrics = lines.map((line) => ({ time: 0, text: line }));
    }

    const lyricsText = cleanedLyrics.map((line) => line.text).join("\n");

    // Step C: Save to Firestore
    setStatus("Saving to Firebase...");
    const songsRef = collection(db, "MusicSongs");
    console.log("Saving document to Firestore (MusicSongs)...");
    await addDoc(songsRef, {
      title,
      artist,
      album: albumEl.value.trim(),
      category: genreEl.value.trim(),
      playlist: languageEl.value.trim(),
      year: Number(yearEl.value) || null,
      lyrics: cleanedLyrics,
      lyricsText,
      audioUrl: secureUrl,
      coverImage,
      createdAt: new Date(),
      adminKey: ADMIN_KEY,
    });

    // Step C: Update matching song in /songs (if exists)
    const songNo = findSongNo(title);
    const existingSong =
      (await findExistingSongDoc(songNo)) ||
      (await findSongDocByTitleArtist(title, artist));
    if (existingSong) {
      console.log("Updating matching /songs doc with audioUrl...");
      await setDoc(
        existingSong.ref,
        {
          audioUrl: secureUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("Matched /songs doc updated.");
    } else {
      console.log("No matching /songs document found to update.");
    }

    console.log("Firestore save complete.");
    setStatus("Audio uploaded and saved.", "success");
    loadUploadedSongs();
  } catch (err) {
    console.error("Upload failed:", err);
    setStatus(`Upload failed: ${err.message || "Unknown error"}`, "error");
  } finally {
    uploadCloudinaryBtn.disabled = false;
    uploadCloudinaryBtn.textContent = "Upload Now";
  }
};

uploadCloudinaryBtn.addEventListener("click", handleUpload);

addLineBtn.addEventListener("click", () => {
  lyrics.push({ time: 0, text: "" });
  renderLyricsTable();
});

setTimeBtn.addEventListener("click", () => {
  if (selectedIndex < 0) {
    setStatus("Select a lyric row first.", "error");
    return;
  }
  lyrics[selectedIndex].time = Number(audioPreview.currentTime.toFixed(2));
  renderLyricsTable();
});

autoTimestampBtn.addEventListener("click", () => {
  if (!audioDuration || !lyrics.length) {
    setStatus("Add lyrics and load audio first.", "error");
    return;
  }
  const step = audioDuration / Math.max(1, lyrics.length - 1);
  lyrics = lyrics.map((line, idx) => ({
    ...line,
    time: Number((idx * step).toFixed(2)),
  }));
  renderLyricsTable();
  setStatus("Timestamps generated.", "success");
});

audioFileEl.addEventListener("change", () => {
  const file = audioFileEl.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  audioPreview.src = url;
  audioPreview.addEventListener(
    "loadedmetadata",
    () => {
      audioDuration = audioPreview.duration || 0;
      setStatus(`Audio loaded · ${audioDuration.toFixed(1)}s`, "success");
    },
    { once: true }
  );

  if (activeSongNo !== null) {
    pendingUploads.set(activeSongNo, file);
    activeSongNo = null;
    renderFolder();
  }
});

const saveSong = async ({ allowNoAudio = false } = {}) => {
  const audioFile = audioFileEl.files[0];
  const coverFile = coverFileEl.files[0];
  const pdfFile = pdfFileEl.files[0];
  const allowUploads = !allowNoAudio;
  const shouldUploadAudio = allowUploads && audioFile;
  const shouldUploadCover = allowUploads && coverFile;
  const shouldUploadPdf = allowUploads && pdfFile;

  const title = titleEl.value.trim();
  const artist = artistEl.value.trim();
  if (!title || !artist) {
    setStatus("Title and artist are required.", "error");
    return;
  }

  const cleanedLyrics = lyrics
    .filter((line) => line.text && line.text.trim().length > 0)
    .map((line) => ({
      time: Number(line.time) || 0,
      text: line.text.trim(),
    }))
    .sort((a, b) => a.time - b.time);

  try {
    const hasAnyFile = shouldUploadAudio || shouldUploadCover || shouldUploadPdf;
    setStatus(
      hasAnyFile
        ? "Uploading files..."
        : allowNoAudio
          ? "Saving lyrics only..."
          : "Saving metadata..."
    );

    const songsRef = collection(db, "songs");
    const songNo = findSongNo(title);
    const existingDoc = await findExistingSongDoc(songNo);
    const songDoc = existingDoc ? existingDoc.ref : doc(songsRef);
    const songId = songDoc.id;

    const uploadMeta = { customMetadata: { adminKey: ADMIN_KEY } };

    let audioUrl = "";
    if (shouldUploadAudio) {
      const audioRef = ref(storage, `songs/${songId}/audio/${audioFile.name}`);
      const audioSnap = await uploadBytes(audioRef, audioFile, uploadMeta);
      audioUrl = await getDownloadURL(audioSnap.ref);
    }

    let coverUrl = "";
    if (shouldUploadCover) {
      const coverRef = ref(
        storage,
        `songs/${songId}/cover/${coverFile.name}`
      );
      const coverSnap = await uploadBytes(coverRef, coverFile, uploadMeta);
      coverUrl = await getDownloadURL(coverSnap.ref);
    }

    let pdfUrl = "";
    if (shouldUploadPdf) {
      const pdfRef = ref(
        storage,
        `songs/${songId}/lyrics/${pdfFile.name}`
      );
      const pdfSnap = await uploadBytes(pdfRef, pdfFile, uploadMeta);
      pdfUrl = await getDownloadURL(pdfSnap.ref);
    }

    const payload = {
      title,
      artist,
      album: albumEl.value.trim(),
      genre: genreEl.value.trim(),
      language: languageEl.value.trim(),
      year: Number(yearEl.value) || null,
      lyrics: cleanedLyrics,
      updatedAt: serverTimestamp(),
      adminKey: ADMIN_KEY,
    };

    if (!existingDoc) {
      payload.createdAt = serverTimestamp();
    }

    if (typeof songNo === "number") {
      payload.no = songNo;
    }

    if (shouldUploadAudio) {
      payload.audioUrl = audioUrl;
      payload.duration = Number(audioDuration.toFixed(1)) || null;
    }

    if (shouldUploadCover) {
      payload.coverUrl = coverUrl;
    }

    if (shouldUploadPdf) {
      payload.pdfUrl = pdfUrl;
    }

    await setDoc(songDoc, payload, { merge: true });

    setStatus("Song saved successfully.", "success");
    loadUploadedSongs();
  } catch (err) {
    console.error(err);
    setStatus("Upload failed. Check console for details.", "error");
  }
};

saveSongBtn.addEventListener("click", () => saveSong());
saveMetadataBtn.addEventListener("click", () =>
  saveSong({ allowNoAudio: true })
);

folderSearchEl.addEventListener("input", renderFolder);
refreshButtons.forEach((button) => {
  button.addEventListener("click", loadUploadedSongs);
});
updateUploadPreview();
setStep(1);
renderFolder();
loadUploadedSongs();
