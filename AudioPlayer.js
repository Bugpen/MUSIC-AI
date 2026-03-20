const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export function initAudioPlayer({
  audioEl,
  playBtn,
  seekEl,
  currentEl,
  durationEl,
  volumeEl,
  prevBtn,
  nextBtn,
  repeatBtn,
  menuBtn,
  menuEl,
  speedEl,
  onPrev,
  onNext,
  onRepeatChange,
}) {
  let repeatMode = "off";
  const playIcon = `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  `;
  const pauseIcon = `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v14H7z" />
      <path d="M13 5h4v14h-4z" />
    </svg>
  `;

  const setPlayIcon = (isPlaying) => {
    playBtn.innerHTML = isPlaying ? pauseIcon : playIcon;
  };

  const updateTime = () => {
    const current = audioEl.currentTime || 0;
    const duration = audioEl.duration || 0;
    currentEl.textContent = formatTime(current);
    durationEl.textContent = formatTime(duration);
    seekEl.value = duration ? (current / duration) * 100 : 0;
  };

  const togglePlay = async () => {
    if (!audioEl.src) return;
    if (audioEl.paused) {
      await audioEl.play();
      setPlayIcon(true);
    } else {
      audioEl.pause();
      setPlayIcon(false);
    }
  };

  playBtn.addEventListener("click", togglePlay);
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (typeof onPrev === "function") onPrev();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (typeof onNext === "function") onNext();
    });
  }
  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      repeatMode =
        repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
      repeatBtn.classList.toggle("active", repeatMode !== "off");
      repeatBtn.title =
        repeatMode === "off"
          ? "Repeat off"
          : repeatMode === "one"
            ? "Repeat one"
            : "Repeat all";
      if (typeof onRepeatChange === "function") onRepeatChange(repeatMode);
    });
  }
  if (menuBtn && menuEl) {
    menuBtn.addEventListener("click", () => {
      menuEl.classList.toggle("open");
    });
  }
  seekEl.addEventListener("input", (event) => {
    const pct = Number(event.target.value) / 100;
    if (!audioEl.duration) return;
    audioEl.currentTime = pct * audioEl.duration;
  });
  if (volumeEl) {
    volumeEl.addEventListener("input", (event) => {
      audioEl.volume = Number(event.target.value);
    });
  }
  if (speedEl) {
    speedEl.addEventListener("change", (event) => {
      audioEl.playbackRate = Number(event.target.value) || 1;
    });
  }

  audioEl.addEventListener("timeupdate", updateTime);
  audioEl.addEventListener("loadedmetadata", updateTime);
  audioEl.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audioEl.currentTime = 0;
      audioEl.play();
      setPlayIcon(true);
      return;
    }
    setPlayIcon(false);
    if (repeatMode === "all" && typeof onNext === "function") {
      onNext();
    }
  });

  const setSource = (url) => {
    if (url) {
      audioEl.src = url;
      audioEl.load();
      setPlayIcon(false);
    } else {
      audioEl.removeAttribute("src");
      audioEl.load();
      setPlayIcon(false);
    }
    updateTime();
  };

  setPlayIcon(false);

  return {
    setSource,
    updateTime,
  };
}
