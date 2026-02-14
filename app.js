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

    // Gentle merge to keep structure stable
    const job = defaultJob();
    job.header = { ...job.header, ...(parsed.header || {}) };
    job.doors.entrance = {
      ...job.doors.entrance,
      ...((parsed.doors && parsed.doors.entrance) || {}),
    };
    job.doors.interior = Array.isArray(parsed?.doors?.interior) ? parsed.doors.interior : [];
    job.doors.notes = (parsed?.doors?.notes ?? "");
    job.windows.items = Array.isArray(parsed?.windows?.items) ? parsed.windows.items : [];
    job.windows.notes = (parsed?.windows?.notes ?? "");
    job.radiators.items = Array.isArray(parsed?.radiators?.items) ? parsed.radiators.items : [];
    job.radiators.notes = (parsed?.radiators?.notes ?? "");
    return job;
  } catch {
    return defaultJob();
  }
}

function saveJob() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.job));
  setStatus("Сохранено локально");
}

function setStatus(text) {
  const el = $("#statusText");
  if (!el) return;
  el.textContent = text;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => (el.textContent = ""), 1500);
}

function sanitizeNumeric(raw) {
  // Keep digits only
  return String(raw || "").replace(/[^\d]/g, "");
}

function isNonEmpty(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function anyNonEmpty(obj) {
  return Object.values(obj).some((v) => isNonEmpty(v));
}

function cardNonEmpty(cardObj) {
  // card is object of fields, treat digits/text
  return anyNonEmpty(cardObj);
}

function buildInteriorDoor(index) {
  return { depth: "", height: "", width: "", _title: `Дверь ${index + 1}` };
}

function buildWindow(index) {
  return { depth: "", height: "", width: "", sill: "", _title: `Окно ${index + 1}` };
}

function buildRadiator(index) {
  return { fromWall: "", fromFloor: "", centerDistance: "", _title: `Радиатор ${index + 1}` };
}

const state = {
  job: loadJob(),
};

// ---------- Rendering ----------
function renderHeader() {
  $("#date").value = state.job.header.date || todayISO();
  $("#address").value = state.job.header.address || "";
  $("#employeeSurname").value = state.job.header.employeeSurname || "";
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

  // entrance fields via data-bind
  document.querySelectorAll("[data-bind]").forEach((inp) => {
    const path = inp.getAttribute("data-bind");
    inp.value = getByPath(state.job, path) ?? "";
  });

  renderInteriorDoors();
  renderWindows();
  renderRadiators();
  renderNotes();
}

// ---------- Path helpers ----------
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
    state.job.doors.interior.push(buildInteriorDoor(state.job.doors.interior.length));
    renderInteriorDoors();
    saveJob();
  });

  $("#addWindow").addEventListener("click", () => {
    state.job.windows.items.push(buildWindow(state.job.windows.items.length));
    renderWindows();
    saveJob();
  });

  $("#addRadiator").addEventListener("click", () => {
    state.job.radiators.items.push(buildRadiator(state.job.radiators.items.length));
    renderRadiators();
    saveJob();
  });

  $("#resetAll").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.job = defaultJob();
    renderAll();
    setStatus("Сброшено");
  });

  $("#downloadPdf").addEventListener("click", () => {
    const pdfBytes = generatePDF(state.job);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const safeDate = (state.job.header.date || todayISO()).replaceAll("-", "");
    const safeSurname = (state.job.header.employeeSurname || "employee").trim() || "employee";
    const filename = `zamery_${safeDate}_${safeSurname}.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 500);

    // ✅ очистка заполненных данных после скачивания PDF
    state.job = defaultJob();   // новая пустая структура (дата будет today)
    saveJob();                  // перезапишем localStorage
    renderAll();                // обновим UI
    setStatus("PDF скачан, форма очищена");
  });
}

function bindDelegatedEvents() {
  // numeric sanitation + autosave for dynamic lists
  document.body.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;

    // Handle bound entrance fields
    if (t.hasAttribute("data-bind")) {
      const path = t.getAttribute("data-bind");
      const cleaned = t.classList.contains("num") ? sanitizeNumeric(t.value) : t.value;
      if (t.value !== cleaned) t.value = cleaned;
      setByPath(state.job, path, cleaned);
      saveJob();
      return;
    }

    // Handle dynamic path inputs
    const path = t.getAttribute("data-path");
    if (path) {
      const cleaned = t.classList.contains("num") ? sanitizeNumeric(t.value) : t.value;
      if (t.value !== cleaned) t.value = cleaned;
      setByPath(state.job, path, cleaned);
      saveJob();
      return;
    }
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

// ---------- PDF generator (template-based, ASCII-safe) ----------
/*
  IMPORTANT:
  Many PDF viewers on Windows are strict about encoding.
  Base-14 fonts (Helvetica) reliably render ASCII, but Cyrillic breaks without embedding a font.
  To keep it offline and dependency-free, we generate an ASCII-only PDF.
*/
function generatePDF(job) {
  // A4 portrait in points: 595.28 x 841.89
  const W = 595.28, H = 841.89;
  const margin = 48;
  const lineH = 14;

  const enc = new TextEncoder();
  function byteLen(s) { return enc.encode(s).length; }

  // ASCII-only PDF string literal
  function pdfStrAscii(s) {
    const t = String(s ?? "")
      .replace(/[^\x20-\x7E]/g, "") // drop non-ASCII (e.g. Cyrillic)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    return `(${t})`;
  }

  let content = "";

  function text(x, y, s, size = 11) {
    const yy = H - y;
    content += `BT /F1 ${size} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td ${pdfStrAscii(s)} Tj ET\n`;
  }

  function sectionTitle(y, title) {
    text(margin, y, title, 14);
    y += 18;
    const yy = H - (y - 6);
    content += `0.8 w 0.85 0.89 0.95 RG ${margin} ${yy} m ${W - margin} ${yy} l S\n`;
    y += 10;
    return y;
  }

  const header = job.header || {};
  const entrance = job.doors?.entrance || {};

  const entrancePrintable = {
    depth: sanitizeNumeric(entrance.depth),
    height: sanitizeNumeric(entrance.height),
    width: sanitizeNumeric(entrance.width),
  };

  const interiorPrintable = (job.doors?.interior || [])
    .map((d) => ({
      depth: sanitizeNumeric(d.depth),
      height: sanitizeNumeric(d.height),
      width: sanitizeNumeric(d.width),
    }))
    .filter(cardNonEmpty);

  const windowsPrintable = (job.windows?.items || [])
    .map((w) => ({
      depth: sanitizeNumeric(w.depth),
      height: sanitizeNumeric(w.height),
      width: sanitizeNumeric(w.width),
      sill: sanitizeNumeric(w.sill),
    }))
    .filter(cardNonEmpty);

  const radiatorsPrintable = (job.radiators?.items || [])
    .map((r) => ({
      fromWall: sanitizeNumeric(r.fromWall),
      fromFloor: sanitizeNumeric(r.fromFloor),
      centerDistance: sanitizeNumeric(r.centerDistance),
    }))
    .filter(cardNonEmpty);

  const notesDoors = (job.doors?.notes || "").trim();
  const notesWindows = (job.windows?.notes || "").trim();
  const notesRadiators = (job.radiators?.notes || "").trim();

  const doorsHasData =
    cardNonEmpty(entrancePrintable) ||
    interiorPrintable.length > 0 ||
    isNonEmpty(notesDoors);

  const windowsHasData =
    windowsPrintable.length > 0 ||
    isNonEmpty(notesWindows);

  const radiatorsHasData =
    radiatorsPrintable.length > 0 ||
    isNonEmpty(notesRadiators);

  // --- Content template ---
  text(margin, 64, "Measurements Report", 18);

  let y = 96;
  y = sectionTitle(y, "Header");

  // Header always included; print only non-empty values, else dash
  let printed = false;
  if (isNonEmpty(header.date)) { text(margin, y, `Date: ${header.date}`, 11); y += lineH; printed = true; }
  if (isNonEmpty(header.address)) { text(margin, y, `Address: ${header.address}`, 11); y += lineH; printed = true; }
  if (isNonEmpty(header.employeeSurname)) { text(margin, y, `Employee: ${header.employeeSurname}`, 11); y += lineH; printed = true; }
  if (!printed) { text(margin, y, "-", 11); y += lineH; }

  if (doorsHasData) {
    y += 10;
    y = sectionTitle(y, "Doors");

    if (cardNonEmpty(entrancePrintable)) {
      text(margin, y, "Entrance door", 12); y += 16;
      if (isNonEmpty(entrancePrintable.depth)) { text(margin + 18, y, `Depth: ${entrancePrintable.depth} mm`, 11); y += lineH; }
      if (isNonEmpty(entrancePrintable.height)) { text(margin + 18, y, `Height: ${entrancePrintable.height} mm`, 11); y += lineH; }
      if (isNonEmpty(entrancePrintable.width)) { text(margin + 18, y, `Width: ${entrancePrintable.width} mm`, 11); y += lineH; }
      y += 6;
    }

    if (interiorPrintable.length > 0) {
      text(margin, y, "Interior doors", 12); y += 16;
      interiorPrintable.forEach((d, i) => {
        text(margin + 18, y, `Door ${i + 1}`, 11); y += lineH;
        if (isNonEmpty(d.depth)) { text(margin + 36, y, `Depth: ${d.depth} mm`, 11); y += lineH; }
        if (isNonEmpty(d.height)) { text(margin + 36, y, `Height: ${d.height} mm`, 11); y += lineH; }
        if (isNonEmpty(d.width)) { text(margin + 36, y, `Width: ${d.width} mm`, 11); y += lineH; }
        y += 6;
      });
    }

    if (isNonEmpty(notesDoors)) {
      text(margin, y, `Notes: ${notesDoors}`, 11); y += lineH;
    }
  }

  if (windowsHasData) {
    y += 10;
    y = sectionTitle(y, "Windows");

    windowsPrintable.forEach((w, i) => {
      text(margin, y, `Window ${i + 1}`, 12); y += 16;
      if (isNonEmpty(w.depth)) { text(margin + 18, y, `Depth: ${w.depth} mm`, 11); y += lineH; }
      if (isNonEmpty(w.height)) { text(margin + 18, y, `Height: ${w.height} mm`, 11); y += lineH; }
      if (isNonEmpty(w.width)) { text(margin + 18, y, `Width: ${w.width} mm`, 11); y += lineH; }
      if (isNonEmpty(w.sill)) { text(margin + 18, y, `Sill: ${w.sill} mm`, 11); y += lineH; }
      y += 6;
    });

    if (isNonEmpty(notesWindows)) {
      text(margin, y, `Notes: ${notesWindows}`, 11); y += lineH;
    }
  }

  if (radiatorsHasData) {
    y += 10;
    y = sectionTitle(y, "Radiators");

    radiatorsPrintable.forEach((r, i) => {
      text(margin, y, `Radiator ${i + 1}`, 12); y += 16;
      if (isNonEmpty(r.fromWall)) { text(margin + 18, y, `From wall: ${r.fromWall} mm`, 11); y += lineH; }
      if (isNonEmpty(r.fromFloor)) { text(margin + 18, y, `From floor: ${r.fromFloor} mm`, 11); y += lineH; }
      if (isNonEmpty(r.centerDistance)) { text(margin + 18, y, `Center distance: ${r.centerDistance} mm`, 11); y += lineH; }
      y += 6;
    });

    if (isNonEmpty(notesRadiators)) {
      text(margin, y, `Notes: ${notesRadiators}`, 11); y += lineH;
    }
  }

  text(margin, H - 40, "Generated offline. Only filled fields are printed.", 9);

  // --- Build PDF objects ---
  let out = "%PDF-1.4\n";
  const xref = [];
  function addObj(n, body) {
    xref[n] = byteLen(out);
    out += `${n} 0 obj\n${body}\nendobj\n`;
  }

  // 1 Catalog, 2 Pages, 3 Page, 4 Contents, 5 Font
  addObj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
  addObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  addObj(5, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  addObj(4, `<< /Length ${byteLen(content)} >>\nstream\n${content}endstream`);
  addObj(3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}]
       /Resources << /Font << /F1 5 0 R >> >>
       /Contents 4 0 R
    >>`.replace(/\s+/g, " ")
  );

  const startxref = byteLen(out);
  out += "xref\n";
  out += "0 6\n";
  out += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    const off = xref[i] || 0;
    out += String(off).padStart(10, "0") + " 00000 n \n";
  }
  out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return enc.encode(out);
}

// ---------- Init ----------
function init() {
  // Default date if missing
  if (!state.job.header.date) state.job.header.date = todayISO();

  renderAll();
  bindStaticInputs();
  bindDelegatedEvents();
  registerSW();

  // initial status
  setStatus("Готово");
}

init();
