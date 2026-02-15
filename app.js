/* Offline Checklist PWA (no server).
   Storage: localStorage
   PDF: generated with a dedicated template (not screen layout).
*/

const STORAGE_KEY = "measurements_job_v1";

const $ = (sel) => document.querySelector(sel);

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function defaultJob() {
  return {
    header: {
      date: todayISO(),
      address: "",
      employeeSurname: "",
    },
    doors: {
      entrance: { depth: "", height: "", width: "" },
      interior: [],
      notes: "",
    },
    windows: {
      items: [],
      notes: "",
    },
    radiators: {
      items: [],
      notes: "",
    },
  };
}

function loadJob() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultJob();
    const parsed = JSON.parse(raw);

    // gentle merge
    const job = defaultJob();
    job.header = { ...job.header, ...(parsed.header || {}) };

    job.doors.entrance = {
      ...job.doors.entrance,
      ...((parsed.doors && parsed.doors.entrance) || {}),
    };
    job.doors.interior = Array.isArray(parsed?.doors?.interior) ? parsed.doors.interior : [];
    job.doors.notes = parsed?.doors?.notes ?? "";

    job.windows.items = Array.isArray(parsed?.windows?.items) ? parsed.windows.items : [];
    job.windows.notes = parsed?.windows?.notes ?? "";

    job.radiators.items = Array.isArray(parsed?.radiators?.items) ? parsed.radiators.items : [];
    job.radiators.notes = parsed?.radiators?.notes ?? "";

    return job;
  } catch {
    return defaultJob();
  }
}

const state = {
  job: loadJob(),
};

// ---------- helpers ----------
function setStatus(text) {
  const el = $("#statusText");
  if (!el) return;
  el.textContent = text;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => (el.textContent = ""), 1500);
}

function saveJob() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.job));
  setStatus("Сохранено локально");
}

function sanitizeNumeric(raw) {
  return String(raw || "").replace(/[^\d]/g, "");
}

function isNonEmpty(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function anyNonEmpty(obj) {
  return Object.values(obj).some((v) => isNonEmpty(v));
}

function cardNonEmpty(cardObj) {
  return anyNonEmpty(cardObj);
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function setByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!(k in cur)) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function buildInteriorDoor() {
  return { depth: "", height: "", width: "" };
}
function buildWindow() {
  return { depth: "", height: "", width: "", sill: "" };
}
function buildRadiator() {
  return { fromWall: "", fromFloor: "", centerDistance: "" };
}

// ---------- Rendering ----------
function renderHeader() {
  $("#date").value = state.job.header.date || todayISO();
  $("#address").value = state.job.header.address || "";
  $("#employeeSurname").value = state.job.header.employeeSurname || "";
}

function renderEntranceDoor() {
  document.querySelectorAll("[data-bind]").forEach((inp) => {
    const path = inp.getAttribute("data-bind");
    inp.value = getByPath(state.job, path) ?? "";
  });
}

function renderInteriorDoors() {
  const root = $("#interiorDoorsList");
  root.innerHTML = "";

  state.job.doors.interior.forEach((door, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "item";

    wrap.innerHTML = `
      <div class="item__head">
        <div class="item__title">Межкомнатная дверь ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-interior" data-index="${idx}">Удалить</button>
      </div>
      <div class="grid grid--3">
        <label class="field">
          <span class="field__label">Глубина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="doors.interior.${idx}.depth" placeholder="мм" value="${door.depth ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Высота (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="doors.interior.${idx}.height" placeholder="мм" value="${door.height ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Ширина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="doors.interior.${idx}.width" placeholder="мм" value="${door.width ?? ""}" />
        </label>
      </div>
    `;
    root.appendChild(wrap);
  });
}

function renderWindows() {
  const root = $("#windowsList");
  root.innerHTML = "";

  state.job.windows.items.forEach((w, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "item";
    wrap.innerHTML = `
      <div class="item__head">
        <div class="item__title">Окно ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-window" data-index="${idx}">Удалить</button>
      </div>
      <div class="grid grid--3">
        <label class="field">
          <span class="field__label">Глубина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.depth" placeholder="мм" value="${w.depth ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Высота (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.height" placeholder="мм" value="${w.height ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Ширина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.width" placeholder="мм" value="${w.width ?? ""}" />
        </label>
      </div>
      <div class="grid grid--3">
        <label class="field">
          <span class="field__label">Подоконник (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.sill" placeholder="мм" value="${w.sill ?? ""}" />
        </label>
        <div></div><div></div>
      </div>
    `;
    root.appendChild(wrap);
  });
}

function renderRadiators() {
  const root = $("#radiatorsList");
  root.innerHTML = "";

  state.job.radiators.items.forEach((r, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "item";
    wrap.innerHTML = `
      <div class="item__head">
        <div class="item__title">Радиатор ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-radiator" data-index="${idx}">Удалить</button>
      </div>
      <div class="grid grid--3">
        <label class="field">
          <span class="field__label">От стены (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="radiators.items.${idx}.fromWall" placeholder="мм" value="${r.fromWall ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">От пола (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="radiators.items.${idx}.fromFloor" placeholder="мм" value="${r.fromFloor ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Межосевое (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="radiators.items.${idx}.centerDistance" placeholder="мм" value="${r.centerDistance ?? ""}" />
        </label>
      </div>
    `;
    root.appendChild(wrap);
  });
}

function renderNotes() {
  $("#notesDoors").value = state.job.doors.notes || "";
  $("#notesWindows").value = state.job.windows.notes || "";
  $("#notesRadiators").value = state.job.radiators.notes || "";
}

function renderAll() {
  renderHeader();
  renderEntranceDoor();
  renderInteriorDoors();
  renderWindows();
  renderRadiators();
  renderNotes();
}

// ---------- Download helper (mobile safe) ----------
function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // mobile fallback: open in new tab
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    setTimeout(() => {
      const opened = window.open(url, "_blank");
      if (!opened) window.location.href = url;
    }, 150);
  }

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ---------- PDF (pdf-lib, local file) ----------
async function generatePDF(job) {
  if (!window.PDFLib) throw new Error("PDFLib not loaded (pdf-lib.min.js missing).");
  if (!window.fontkit) throw new Error("fontkit not loaded (fontkit.umd.min.js missing).");

  const { PDFDocument } = window.PDFLib;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(window.fontkit);

  // Load fonts (must be in the same folder as index.html)
  const robotoBytes = await fetch("./Roboto-Regular.ttf").then((r) => {
    if (!r.ok) throw new Error("Roboto-Regular.ttf not found");
    return r.arrayBuffer();
  });
  const manascoBytes = await fetch("./Manasco.otf").then((r) => {
    if (!r.ok) throw new Error("Manasco.otf not found");
    return r.arrayBuffer();
  });

  const fontText = await pdfDoc.embedFont(robotoBytes, { subset: true });
  const fontTitle = await pdfDoc.embedFont(manascoBytes, { subset: true });

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const W = 595.28;
  const H = 841.89;

  const marginX = 48;
  let y = H - 70;

  const gap = 6;

  const colorText = window.PDFLib.rgb(0.12, 0.14, 0.18);
  const colorMuted = window.PDFLib.rgb(0.45, 0.48, 0.55);
  const colorRule = window.PDFLib.rgb(0.85, 0.87, 0.91);

  const SIZE_TITLE = 24;
  const SIZE_H2 = 13.5;
  const SIZE_TEXT = 11;
  const SIZE_SMALL = 9;

  function draw(text, opts = {}) {
    const {
      size = SIZE_TEXT,
      font = fontText,
      x = marginX,
      color = colorText,
      line = true,
    } = opts;

    page.drawText(String(text), { x, y, size, font, color });
    if (line) y -= (size + gap);
  }

  function rule() {
    const yLine = y + 4;
    page.drawLine({
      start: { x: marginX, y: yLine },
      end: { x: W - marginX, y: yLine },
      thickness: 1,
      color: colorRule,
    });
    y -= 14;
  }

  function section(title) {
    y -= 8;
    draw(title, { font: fontTitle, size: SIZE_H2 });
    rule();
  }

  function isNonEmpty(v) {
    return v !== null && v !== undefined && String(v).trim() !== "";
  }

  function N(raw) {
    return String(raw || "").replace(/[^\d]/g, "");
  }

  function cardNonEmpty(obj) {
    return Object.values(obj).some((v) => isNonEmpty(v));
  }

  // ---------- Collect printable data ----------
  const header = job?.header || {};
  const doors = job?.doors || {};
  const windows = job?.windows || {};
  const radiators = job?.radiators || {};

  const entrance = doors?.entrance || {};
  const entranceP = { depth: N(entrance.depth), height: N(entrance.height), width: N(entrance.width) };

  const interiorP = (doors?.interior || [])
    .map((d) => ({ depth: N(d.depth), height: N(d.height), width: N(d.width) }))
    .filter(cardNonEmpty);

  const windowsP = (windows?.items || [])
    .map((w) => ({ depth: N(w.depth), height: N(w.height), width: N(w.width), sill: N(w.sill) }))
    .filter(cardNonEmpty);

  const radiatorsP = (radiators?.items || [])
    .map((r) => ({ fromWall: N(r.fromWall), fromFloor: N(r.fromFloor), centerDistance: N(r.centerDistance) }))
    .filter(cardNonEmpty);

  const notesDoors = String(doors?.notes || "").trim();
  const notesWindows = String(windows?.notes || "").trim();
  const notesRadiators = String(radiators?.notes || "").trim();

  const doorsHas = cardNonEmpty(entranceP) || interiorP.length > 0 || isNonEmpty(notesDoors);
  const windowsHas = windowsP.length > 0 || isNonEmpty(notesWindows);
  const radiatorsHas = radiatorsP.length > 0 || isNonEmpty(notesRadiators);

  // ---------- Draw PDF ----------
  draw("Замеры", { font: fontTitle, size: SIZE_TITLE });
  draw("Отчёт по объекту", { font: fontText, size: SIZE_TEXT, color: colorMuted });
  y -= 6;

  section("Шапка");
  let printed = false;
  if (isNonEmpty(header.date)) { draw(`Дата: ${header.date}`); printed = true; }
  if (isNonEmpty(header.address)) { draw(`Адрес: ${header.address}`); printed = true; }
  if (isNonEmpty(header.employeeSurname)) { draw(`Сотрудник: ${header.employeeSurname}`); printed = true; }
  if (!printed) draw("—", { color: colorMuted });

  if (doorsHas) {
    section("Двери");

    if (cardNonEmpty(entranceP)) {
      draw("Входная дверь", { font: fontTitle, size: 12.5 });
      if (isNonEmpty(entranceP.depth)) draw(`Глубина: ${entranceP.depth} мм`, { x: marginX + 14 });
      if (isNonEmpty(entranceP.height)) draw(`Высота: ${entranceP.height} мм`, { x: marginX + 14 });
      if (isNonEmpty(entranceP.width)) draw(`Ширина: ${entranceP.width} мм`, { x: marginX + 14 });
      y -= 4;
    }

    if (interiorP.length > 0) {
      draw("Межкомнатные двери", { font: fontTitle, size: 12.5 });
      interiorP.forEach((d, i) => {
        draw(`Дверь ${i + 1}`, { x: marginX + 14, color: colorMuted });
        if (isNonEmpty(d.depth)) draw(`Глубина: ${d.depth} мм`, { x: marginX + 28 });
        if (isNonEmpty(d.height)) draw(`Высота: ${d.height} мм`, { x: marginX + 28 });
        if (isNonEmpty(d.width)) draw(`Ширина: ${d.width} мм`, { x: marginX + 28 });
        y -= 4;
      });
    }

    if (isNonEmpty(notesDoors)) {
      draw("Заметки:", { font: fontTitle, size: 12.5 });
      draw(notesDoors, { x: marginX + 14 });
    }
  }

  if (windowsHas) {
    section("Окна");

    windowsP.forEach((w, i) => {
      draw(`Окно ${i + 1}`, { font: fontTitle, size: 12.5 });
      if (isNonEmpty(w.depth)) draw(`Глубина: ${w.depth} мм`, { x: marginX + 14 });
      if (isNonEmpty(w.height)) draw(`Высота: ${w.height} мм`, { x: marginX + 14 });
      if (isNonEmpty(w.width)) draw(`Ширина: ${w.width} мм`, { x: marginX + 14 });
      if (isNonEmpty(w.sill)) draw(`Подоконник: ${w.sill} мм`, { x: marginX + 14 });
      y -= 4;
    });

    if (isNonEmpty(notesWindows)) {
      draw("Заметки:", { font: fontTitle, size: 12.5 });
      draw(notesWindows, { x: marginX + 14 });
    }
  }

  if (radiatorsHas) {
    section("Радиаторы");

    radiatorsP.forEach((r, i) => {
      draw(`Радиатор ${i + 1}`, { font: fontTitle, size: 12.5 });
      if (isNonEmpty(r.fromWall)) draw(`От стены: ${r.fromWall} мм`, { x: marginX + 14 });
      if (isNonEmpty(r.fromFloor)) draw(`От пола: ${r.fromFloor} мм`, { x: marginX + 14 });
      if (isNonEmpty(r.centerDistance)) draw(`Межосевое: ${r.centerDistance} мм`, { x: marginX + 14 });
      y -= 4;
    });

    if (isNonEmpty(notesRadiators)) {
      draw("Заметки:", { font: fontTitle, size: 12.5 });
      draw(notesRadiators, { x: marginX + 14 });
    }
  }

  // footer
  page.drawText("Сгенерировано офлайн. В отчёт попадают только заполненные поля.", {
    x: marginX,
    y: 26,
    size: SIZE_SMALL,
    font: fontText,
    color: colorMuted,
  });

  return await pdfDoc.save();
}


// ---------- Events ----------
function bindStaticInputs() {
  $("#date").addEventListener("input", (e) => {
    state.job.header.date = e.target.value || todayISO();
    saveJob();
  });
  $("#address").addEventListener("input", (e) => {
    state.job.header.address = e.target.value;
    saveJob();
  });
  $("#employeeSurname").addEventListener("input", (e) => {
    state.job.header.employeeSurname = e.target.value;
    saveJob();
  });

  $("#notesDoors").addEventListener("input", (e) => {
    state.job.doors.notes = e.target.value;
    saveJob();
  });
  $("#notesWindows").addEventListener("input", (e) => {
    state.job.windows.notes = e.target.value;
    saveJob();
  });
  $("#notesRadiators").addEventListener("input", (e) => {
    state.job.radiators.notes = e.target.value;
    saveJob();
  });

  $("#addInteriorDoor").addEventListener("click", () => {
    state.job.doors.interior.push(buildInteriorDoor());
    renderInteriorDoors();
    saveJob();
  });

  $("#addWindow").addEventListener("click", () => {
    state.job.windows.items.push(buildWindow());
    renderWindows();
    saveJob();
  });

  $("#addRadiator").addEventListener("click", () => {
    state.job.radiators.items.push(buildRadiator());
    renderRadiators();
    saveJob();
  });

  $("#resetAll").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.job = defaultJob();
    renderAll();
    setStatus("Сброшено");
  });

  $("#downloadPdf").addEventListener("click", async () => {
  try {
    const pdfBytes = await generatePDF(state.job);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const safeDate = (state.job.header.date || todayISO()).replaceAll("-", "");
    const safeSurname = (state.job.header.employeeSurname || "employee").trim() || "employee";
    const filename = `zamery_${safeDate}_${safeSurname}.pdf`;

    downloadPdfBlob(blob, filename);
  } catch (e) {
    console.error(e);
    alert("Не удалось сформировать PDF. Проверь консоль (ошибка шрифтов/файлов).");
  }
});

}

function bindDelegatedEvents() {
  document.body.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) return;

    const bindPath = t.getAttribute && t.getAttribute("data-bind");
    const path = bindPath || (t.getAttribute && t.getAttribute("data-path"));
    if (!path) return;

    const isNum = t.classList && t.classList.contains("num");
    const cleaned = isNum ? sanitizeNumeric(t.value) : t.value;

    if (t.value !== cleaned) t.value = cleaned;
    setByPath(state.job, path, cleaned);
    saveJob();
  });

  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const indexStr = btn.getAttribute("data-index");
    if (!action || indexStr === null) return;

    const idx = Number(indexStr);

    if (action === "remove-interior") {
      state.job.doors.interior.splice(idx, 1);
      renderInteriorDoors();
      saveJob();
    }
    if (action === "remove-window") {
      state.job.windows.items.splice(idx, 1);
      renderWindows();
      saveJob();
    }
    if (action === "remove-radiator") {
      state.job.radiators.items.splice(idx, 1);
      renderRadiators();
      saveJob();
    }
  });
}

// ---------- PWA (service worker) ----------
async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // silent
  }
}

// ---------- Init ----------
function init() {
  if (!state.job.header.date) state.job.header.date = todayISO();
  renderAll();
  bindStaticInputs();
  bindDelegatedEvents();
  registerSW();
  setStatus("Готово");
}

init();
