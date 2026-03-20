export function renderLyrics(containerEl, lyrics, { editable = false } = {}) {
  containerEl.innerHTML = "";
  const lineEls = [];

  lyrics.forEach((line, index) => {
    if (editable) {
      const row = document.createElement("div");
      row.className = "preview-edit";
      row.dataset.index = index;

      const timeInput = document.createElement("input");
      timeInput.type = "number";
      timeInput.step = "0.1";
      timeInput.min = "0";
      timeInput.value = Number(line.time) || 0;
      timeInput.dataset.field = "time";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = line.text || "";
      textInput.dataset.field = "text";

      row.append(timeInput, textInput);
      containerEl.appendChild(row);
      lineEls.push(row);
      return;
    }

    const lineEl = document.createElement("div");
    lineEl.className = "preview-line";
    lineEl.dataset.index = index;
    lineEl.textContent = line.text || "";
    containerEl.appendChild(lineEl);
    lineEls.push(lineEl);
  });

  return lineEls;
}

export function collectLyrics(containerEl) {
  const rows = Array.from(containerEl.querySelectorAll(".preview-edit"));
  return rows.map((row) => {
    const timeInput = row.querySelector('input[data-field="time"]');
    const textInput = row.querySelector('input[data-field="text"]');
    return {
      time: Number(timeInput?.value || 0),
      text: String(textInput?.value || "").trim(),
    };
  });
}
