export function createSyncEngine({ audioEl, lyrics, lineEls, containerEl }) {
  let activeIndex = -1;

  const findActive = (time) => {
    let low = 0;
    let high = lyrics.length - 1;
    let result = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lyrics[mid].time <= time) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result;
  };

  const scrollToLine = (el) => {
    if (!containerEl || !el) return;
    const containerRect = containerEl.getBoundingClientRect();
    const lineRect = el.getBoundingClientRect();
    const offset = lineRect.top - containerRect.top - containerRect.height * 0.35;
    containerEl.scrollBy({ top: offset, behavior: "smooth" });
  };

  const onTimeUpdate = () => {
    if (!lyrics.length) return;
    const index = findActive(audioEl.currentTime || 0);
    if (index === activeIndex || index < 0) return;

    if (lineEls[activeIndex]) {
      lineEls[activeIndex].classList.remove("active");
    }
    activeIndex = index;
    if (lineEls[activeIndex]) {
      lineEls[activeIndex].classList.add("active");
      scrollToLine(lineEls[activeIndex]);
    }
  };

  audioEl.addEventListener("timeupdate", onTimeUpdate);

  return {
    destroy() {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    },
  };
}
