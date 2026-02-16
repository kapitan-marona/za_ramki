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

// name fields (backward compatible)
function buildInteriorDoor() {
  return { name: "", depth: "", height: "", width: "" };
}
function buildWindow() {
  return {
    name: "",
    depth: "",
    height: "",
    width: "",
    // legacy single-field sill (kept for backward compatibility)
    sill: "",
    // new sill measurements (designer-friendly)
    sillDepth: "",
    sillHeight: "",
    sillWidth: "",
  };
}
function buildRadiator() {
  return { name: "", fromWall: "", fromFloor: "", centerDistance: "" };
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
        <div class="item__title">
          <input
            class="name"
            type="text"
            data-path="doors.interior.${idx}.name"
            placeholder="Межкомнатная дверь ${idx + 1}"
            value="${door.name ?? ""}"
          />
        </div>
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
        <div class="item__title">
          <input
            class="name"
            type="text"
            data-path="windows.items.${idx}.name"
            placeholder="Окно ${idx + 1}"
            value="${w.name ?? ""}"
          />
        </div>
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
          <span class="field__label">Подоконник — Глубина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.sillDepth" placeholder="мм" value="${w.sillDepth ?? w.sill ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Подоконник — Высота от пола (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.sillHeight" placeholder="мм" value="${w.sillHeight ?? ""}" />
        </label>
        <label class="field">
          <span class="field__label">Подоконник — Ширина/длина (мм)</span>
          <input class="num" inputmode="numeric" pattern="[0-9]*" data-path="windows.items.${idx}.sillWidth" placeholder="мм" value="${w.sillWidth ?? ""}" />
        </label>
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
        <div class="item__title">
          <input
            class="name"
            type="text"
            data-path="radiators.items.${idx}.name"
            placeholder="Радиатор ${idx + 1}"
            value="${r.name ?? ""}"
          />
        </div>
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

  const robotoBytes = await fetch("./Roboto-Regular.ttf").then((r) => {
    if (!r.ok) throw new Error("Roboto-Regular.ttf not found");
    return r.arrayBuffer();
  });

  const robotoMediumBytes = await fetch("./Roboto-Medium.ttf").then((r) => {
    if (!r.ok) throw new Error("Roboto-Medium.ttf not found");
    return r.arrayBuffer();
  });

  const titleBytes = await fetch("./Manasco.otf").then((r) => {
    if (!r.ok) throw new Error("Manasco.otf not found");
    return r.arrayBuffer();
  });

  const fontText = await pdfDoc.embedFont(robotoBytes, { subset: true }); // body
  const fontH = await pdfDoc.embedFont(robotoMediumBytes, { subset: true }); // headers
  const fontTitle = await pdfDoc.embedFont(titleBytes, { subset: true }); // ZAMERY

  const W = 595.28;
  const H = 841.89;

  const BG = window.PDFLib.rgb(31 / 255, 30 / 255, 26 / 255); // #1F1E1A

  const colorText = window.PDFLib.rgb(0.95, 0.95, 0.93);
  const colorMuted = window.PDFLib.rgb(0.78, 0.78, 0.74);
  const colorCard = window.PDFLib.rgb(0.12, 0.12, 0.11);
  const colorCardBorder = window.PDFLib.rgb(0.30, 0.30, 0.28);
  const colorCapsule = window.PDFLib.rgb(0.16, 0.16, 0.15); // твоё

  const marginX = 48;
  const marginBottom = 54;
  const gap = 6;

  const SIZE_TEXT = 11;
  const SIZE_SMALL = 9;

  // columns
  const colGap = 14;
  const colW = (W - marginX * 2 - colGap) / 2;
  const colX1 = marginX;
  const colX2 = marginX + colW + colGap;

  let page = null;
  let y = 0;

  function newPage() {
    page = pdfDoc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BG });
    y = H - 70;
  }

  function ensureSpace(minHeight) {
    if (y - minHeight < marginBottom) newPage();
  }

  function isNonEmptyLocal(v) {
    return v !== null && v !== undefined && String(v).trim() !== "";
  }

  function N(raw) {
    return String(raw || "").replace(/[^\d]/g, "");
  }

  function cardNonEmptyLocal(obj) {
    return Object.values(obj).some((v) => isNonEmptyLocal(v));
  }

  function formatDateDDMMYYYY(s) {
    const raw = String(s || "").trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return raw;
  }

  function drawSpaced(text, x, size, spacing = 1.2) {
    let xx = x;
    for (const ch of text) {
      page.drawText(ch, { x: xx, y, size, font: fontTitle, color: colorText });
      xx += fontTitle.widthOfTextAtSize(ch, size) + spacing;
    }
    y -= size + gap;
  }

  function card(title, rows) {
    const padding = 12;
    const rowH = 16;
    const headerH = 20;

    const safeRows = Array.isArray(rows) ? rows.filter((r) => isNonEmptyLocal(r)) : [];
    const h = padding + headerH + safeRows.length * rowH + padding;

    ensureSpace(h + 10);

    const x = marginX;
    const w = W - marginX * 2;
    const yTop = y;

    page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      color: colorCard,
      borderColor: colorCardBorder,
      borderWidth: 1,
    });

    page.drawText(String(title), {
      x: x + padding,
      y: yTop - padding - 14,
      size: 12.5,
      font: fontH,
      color: colorText,
    });

    let yy = yTop - padding - headerH;
    safeRows.forEach((row) => {
      page.drawText(String(row), {
        x: x + padding,
        y: yy - 12,
        size: SIZE_TEXT,
        font: fontText,
        color: colorMuted,
      });
      yy -= rowH;
    });

    y = yTop - h - 12;
  }

  // ---- capsule (rounded rect) via SVG path ----
  function roundedRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    const x0 = x, y0 = y;
    const x1 = x + w, y1 = y + h;

    return [
      `M ${x0 + rr} ${y0}`,
      `L ${x1 - rr} ${y0}`,
      `C ${x1 - rr / 2} ${y0} ${x1} ${y0 + rr / 2} ${x1} ${y0 + rr}`,
      `L ${x1} ${y1 - rr}`,
      `C ${x1} ${y1 - rr / 2} ${x1 - rr / 2} ${y1} ${x1 - rr} ${y1}`,
      `L ${x0 + rr} ${y1}`,
      `C ${x0 + rr / 2} ${y1} ${x0} ${y1 - rr / 2} ${x0} ${y1 - rr}`,
      `L ${x0} ${y0 + rr}`,
      `C ${x0} ${y0 + rr / 2} ${x0 + rr / 2} ${y0} ${x0 + rr} ${y0}`,
      "Z",
    ].join(" ");
  }

  // rows: [{label,c1,c2,c3,(c4)}], cols: {h1,h2,h3,(h4)}
  function sectionBlockAt(x, w, yTop, titleCaps, rows, noteTitle, noteText, cols) {
    const paddingX = 10;
    const padTop = 8;

    const rowH = 14;
    const gapAfterTitle = 8;
    const gapAfterRows = 6;

    const safeRows = Array.isArray(rows) ? rows : [];
    const rowsCount = safeRows.length;
    const hasNote = isNonEmptyLocal(noteText);
    const noteLinesCount = hasNote
      ? String(noteText).split("\n").map((s) => s.trim()).filter(Boolean).length
      : 0;

    // number of value columns (default 3)
    const headers = [
      String(cols?.h1 || ""),
      String(cols?.h2 || ""),
      String(cols?.h3 || ""),
      String(cols?.h4 || ""),
    ].filter((s) => s && s.trim().length > 0);
    const colCount = Math.max(3, Math.min(4, headers.length || 3));

    // высота блока (без большой карточки)
    const h =
      padTop +
      22 + // area for capsule+line
      gapAfterTitle +
      (rowsCount ? rowH * (rowsCount + 1) : rowH * 2) + // +1 = header row
      gapAfterRows +
      (hasNote ? (18 + rowH * (1 + Math.max(1, noteLinesCount))) : 0) +
      6;

    // capsule
    const titleSize = 12;
    const capPadX = 10;
    const capPadY = 4;

    const titleW = fontH.widthOfTextAtSize(String(titleCaps), titleSize);
    const capsuleW = Math.min(w * 0.62, titleW + capPadX * 2);
    const capsuleH = titleSize + capPadY * 2;

    const capX = x + paddingX;
    const capY = yTop - padTop - capsuleH;

    page.drawSvgPath(roundedRectPath(capX, capY, capsuleW, capsuleH, 7), {
      color: colorCapsule,
    });

    page.drawText(String(titleCaps), {
      x: capX + capPadX,
      y: capY + capPadY + 1,
      size: titleSize,
      font: fontH,
      color: colorText,
    });

    // thin line to the right of capsule
    const lineY = capY + capsuleH / 2;
    page.drawLine({
      start: { x: capX + capsuleW + 10, y: lineY },
      end: { x: x + w - paddingX, y: lineY },
      thickness: 1,
      color: colorCardBorder,
    });

    // table layout
    let yy = capY - gapAfterTitle;

    // slightly smaller label area when we have 4 value cols
    const labelW = Math.floor(w * (colCount === 4 ? 0.44 : 0.52));
    const cW = Math.floor((w - paddingX * 2 - labelW) / colCount);

    const xLabel = x + paddingX;

    // x positions for each value column
    const xCols = [];
    for (let i = 0; i < colCount; i++) {
      xCols.push(xLabel + labelW + cW * i);
    }

    // header (right-aligned)
    const headerSize = 10;
    const headerFont = fontH;

    const defaultHeaders = colCount === 4 ? ["Г", "В", "Ш", "П"] : ["Г", "В", "Ш"];
    const headersFinal = [];
    for (let i = 0; i < colCount; i++) {
      headersFinal.push(String(headers[i] || defaultHeaders[i] || ""));
    }

    headersFinal.forEach((hTxt, i) => {
      page.drawText(hTxt, {
        x: xCols[i] + cW - 8 - headerFont.widthOfTextAtSize(hTxt, headerSize),
        y: yy - 11,
        size: headerSize,
        font: headerFont,
        color: colorText,
      });
    });

    // rule under header
    page.drawLine({
      start: { x: x + paddingX, y: yy - 14 },
      end: { x: x + w - paddingX, y: yy - 14 },
      thickness: 1,
      color: colorCardBorder,
    });

    yy -= rowH;

    if (!rowsCount) {
      page.drawText("—", {
        x: xLabel,
        y: yy - 11,
        size: SIZE_TEXT,
        font: fontText,
        color: colorMuted,
      });
      yy -= rowH;
    } else {
      safeRows.forEach((r, idx) => {
        const label = String(r?.label || "").trim() || "—";
        const values = [
          String(r?.c1 || "").trim(),
          String(r?.c2 || "").trim(),
          String(r?.c3 || "").trim(),
          String(r?.c4 || "").trim(),
        ].slice(0, colCount);

        page.drawText(label, {
          x: xLabel,
          y: yy - 11,
          size: SIZE_TEXT,
          font: fontText,
          color: colorMuted,
        });

        // values right-aligned within their cells
        values.forEach((v, i) => {
          if (!v) return;
          page.drawText(v, {
            x: xCols[i] + cW - 8 - fontText.widthOfTextAtSize(v, SIZE_TEXT),
            y: yy - 11,
            size: SIZE_TEXT,
            font: fontText,
            color: colorText,
          });
        });

        // micro divider between rows
        if (idx !== safeRows.length - 1) {
          page.drawLine({
            start: { x: x + paddingX, y: yy - 14 },
            end: { x: x + w - paddingX, y: yy - 14 },
            thickness: 1,
            color: window.PDFLib.rgb(0.22, 0.22, 0.20),
          });
        }

        yy -= rowH;
      });
    }

    // comment
    if (hasNote) {
      yy -= 2;
      page.drawLine({
        start: { x: x + paddingX, y: yy },
        end: { x: x + w - paddingX, y: yy },
        thickness: 1,
        color: colorCardBorder,
      });
      yy -= 10;

      page.drawText(String(noteTitle || "Комментарий:"), {
        x: x + paddingX,
        y: yy - 11,
        size: SIZE_TEXT,
        font: fontH,
        color: colorText,
      });
      yy -= rowH;

      const noteLines = String(noteText)
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (noteLines.length === 0) noteLines.push("—");

      noteLines.forEach((ln) => {
        page.drawText(ln, {
          x: x + paddingX,
          y: yy - 11,
          size: SIZE_TEXT,
          font: fontText,
          color: colorMuted,
        });
        yy -= rowH;
      });
    }

    return h + 10;
  }

  // ---------- Collect printable data ----------
  const header = job?.header || {};
  const doors = job?.doors || {};
  const windows = job?.windows || {};
  const radiators = job?.radiators || {};

  const entrance = doors?.entrance || {};
  const entranceP = { depth: N(entrance.depth), height: N(entrance.height), width: N(entrance.width) };

  const interiorP = (doors?.interior || [])
    .map((d) => ({
      name: String(d?.name || "").trim(),
      depth: N(d?.depth),
      height: N(d?.height),
      width: N(d?.width),
    }))
    .filter(cardNonEmptyLocal);

  const windowsP = (windows?.items || [])
    .map((w) => ({
      name: String(w?.name || "").trim(),
      depth: N(w?.depth),
      height: N(w?.height),
      width: N(w?.width),
      // new sill fields; fallback to legacy `sill` as depth if present
      sillDepth: N(w?.sillDepth) || N(w?.sill),
      sillHeight: N(w?.sillHeight),
      sillWidth: N(w?.sillWidth),
      // keep legacy value for completeness (not used in PDF/UI)
      sill: N(w?.sill),
    }))
    .filter(cardNonEmptyLocal);

  const radiatorsP = (radiators?.items || [])
    .map((r) => ({
      name: String(r?.name || "").trim(),
      fromWall: N(r?.fromWall),
      fromFloor: N(r?.fromFloor),
      centerDistance: N(r?.centerDistance),
    }))
    .filter(cardNonEmptyLocal);

  const notesDoors = String(doors?.notes || "").trim();
  const notesWindows = String(windows?.notes || "").trim();
  const notesRadiators = String(radiators?.notes || "").trim();

  const doorsHas = cardNonEmptyLocal(entranceP) || interiorP.length > 0 || isNonEmptyLocal(notesDoors);
  const windowsHas = windowsP.length > 0 || isNonEmptyLocal(notesWindows);
  const radiatorsHas = radiatorsP.length > 0 || isNonEmptyLocal(notesRadiators);

  // ---------- Draw PDF ----------
  newPage();

  // Title only
  const titleText = "ЗАМЕРЫ";
  const TITLE_SIZE = 32;
  const letterSpacing = 1.2;

  let titleWidth = 0;
  for (const ch of titleText) titleWidth += fontTitle.widthOfTextAtSize(ch, TITLE_SIZE) + letterSpacing;
  titleWidth -= letterSpacing;

  y = H - 92;
  const titleX = (W - titleWidth) / 2;
  drawSpaced(titleText, titleX, TITLE_SIZE, letterSpacing);

  y -= 6;

  // Data card (full width)
  const headerRows = [];
  if (isNonEmptyLocal(header.date)) headerRows.push(`Дата: ${formatDateDDMMYYYY(header.date)}`);
  if (isNonEmptyLocal(header.address)) headerRows.push(`Адрес: ${header.address}`);
  if (isNonEmptyLocal(header.employeeSurname)) headerRows.push(`Сотрудник: ${header.employeeSurname}`);
  if (headerRows.length === 0) headerRows.push("—");

  card("Данные объекта", headerRows);

  // Columns start
  let yCol1 = y;
  let yCol2 = y;

  function estimateBlockHeight(rows, noteText) {
    const n = Array.isArray(rows) ? rows.length : 0;
    const hasNote = isNonEmptyLocal(noteText);

    const noteLines = hasNote
      ? String(noteText).split("\n").map((s) => s.trim()).filter(Boolean).length
      : 0;

    // rough but safe; accounts for multi-line notes
    return 90 + (n + 1) * 14 + (hasNote ? (30 + 14 * (1 + Math.max(1, noteLines))) : 0);
  }

  function placeInColumns(titleCaps, rows, noteText, cols) {
    const useFirst = yCol1 >= yCol2;
    const x = useFirst ? colX1 : colX2;
    const w = colW;
    const yTop = useFirst ? yCol1 : yCol2;

    const roughH = estimateBlockHeight(rows, noteText);

    if (yTop - roughH < marginBottom) {
      newPage();
      yCol1 = y;
      yCol2 = y;
      return placeInColumns(titleCaps, rows, noteText, cols);
    }

    const used = sectionBlockAt(x, w, yTop, titleCaps, rows, "Комментарий:", noteText, cols);
    if (useFirst) yCol1 -= used;
    else yCol2 -= used;
  }

  // ---- DOORS (Г/В/Ш) ----
  if (doorsHas) {
    const rows = [];

    if (cardNonEmptyLocal(entranceP)) {
      rows.push({
        label: "Входная дверь",
        c1: entranceP.depth ? String(entranceP.depth) : "",
        c2: entranceP.height ? String(entranceP.height) : "",
        c3: entranceP.width ? String(entranceP.width) : "",
      });
    }

    interiorP.forEach((d, i) => {
      const t = d.name || `М/к дверь ${i + 1}`;
      rows.push({
        label: t,
        c1: d.depth ? String(d.depth) : "",
        c2: d.height ? String(d.height) : "",
        c3: d.width ? String(d.width) : "",
      });
    });

    placeInColumns("ДВЕРИ", rows, notesDoors, { h1: "Г", h2: "В", h3: "Ш" });
  }

  // ---- WINDOWS (Г/В/Ш + подоконник отдельной строкой под окном) ----
  if (windowsHas) {
    const rows = [];

    windowsP.forEach((w, i) => {
      const t = w.name || `Окно ${i + 1}`;

      // window row
      rows.push({
        label: t,
        c1: w.depth ? String(w.depth) : "",
        c2: w.height ? String(w.height) : "",
        c3: w.width ? String(w.width) : "",
      });

      // sill row (only if at least one value is present)
      const hasSill =
        isNonEmptyLocal(w.sillDepth) ||
        isNonEmptyLocal(w.sillHeight) ||
        isNonEmptyLocal(w.sillWidth);

      if (hasSill) {
        rows.push({
          label: "— Подоконник",
          c1: w.sillDepth ? String(w.sillDepth) : "",
          c2: w.sillHeight ? String(w.sillHeight) : "",
          c3: w.sillWidth ? String(w.sillWidth) : "",
        });
      }
    });

    // keep section comment separate from sill rows
    placeInColumns("ОКНА", rows, notesWindows, { h1: "Г", h2: "В", h3: "Ш" });
  }

  // ---- RADIATORS (С/П/М) ----
  if (radiatorsHas) {
    const rows = [];

    radiatorsP.forEach((r, i) => {
      const t = r.name || `Радиатор ${i + 1}`;
      rows.push({
        label: t,
        c1: r.fromWall ? String(r.fromWall) : "",
        c2: r.fromFloor ? String(r.fromFloor) : "",
        c3: r.centerDistance ? String(r.centerDistance) : "",
      });
    });

    placeInColumns("РАДИАТОРЫ", rows, notesRadiators, { h1: "С", h2: "П", h3: "М" });
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
