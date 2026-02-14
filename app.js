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
  setStatus("Saved locally");
}

function setStatus(text) {
  const el = $("#statusText");
  if (!el) return;
  el.textContent = text;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => (el.textContent = ""), 1500);
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

function buildInteriorDoor() {
  return { depth: "", height: "", width: "" };
}

function buildWindow() {
  return { depth: "", height: "", width: "", sill: "" };
}

function buildRadiator() {
  return { fromWall: "", fromFloor: "", centerDistance: "" };
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
        <div class="item__title">Interior door ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-interior" data-index="${idx}">Remove</button>
      </div>
      <div class="grid grid--3">
        <input class="num" inputmode="numeric" data-path="doors.interior.${idx}.depth" placeholder="Depth mm" value="${door.depth ?? ""}" />
        <input class="num" inputmode="numeric" data-path="doors.interior.${idx}.height" placeholder="Height mm" value="${door.height ?? ""}" />
        <input class="num" inputmode="numeric" data-path="doors.interior.${idx}.width" placeholder="Width mm" value="${door.width ?? ""}" />
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
        <div class="item__title">Window ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-window" data-index="${idx}">Remove</button>
      </div>
      <div class="grid grid--3">
        <input class="num" inputmode="numeric" data-path="windows.items.${idx}.depth" placeholder="Depth mm" value="${w.depth ?? ""}" />
        <input class="num" inputmode="numeric" data-path="windows.items.${idx}.height" placeholder="Height mm" value="${w.height ?? ""}" />
        <input class="num" inputmode="numeric" data-path="windows.items.${idx}.width" placeholder="Width mm" value="${w.width ?? ""}" />
      </div>
      <input class="num" inputmode="numeric" data-path="windows.items.${idx}.sill" placeholder="Sill mm" value="${w.sill ?? ""}" />
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
        <div class="item__title">Radiator ${idx + 1}</div>
        <button class="btn btn--danger" type="button" data-action="remove-radiator" data-index="${idx}">Remove</button>
      </div>
      <div class="grid grid--3">
        <input class="num" inputmode="numeric" data-path="radiators.items.${idx}.fromWall" placeholder="From wall mm" value="${r.fromWall ?? ""}" />
        <input class="num" inputmode="numeric" data-path="radiators.items.${idx}.fromFloor" placeholder="From floor mm" value="${r.fromFloor ?? ""}" />
        <input class="num" inputmode="numeric" data-path="radiators.items.${idx}.centerDistance" placeholder="Center distance mm" value="${r.centerDistance ?? ""}" />
      </div>
    `;
    root.appendChild(wrap);
  });
}

function renderAll() {
  renderHeader();
  renderInteriorDoors();
  renderWindows();
  renderRadiators();
}

// ---------- Download helper (mobile safe) ----------
function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    setTimeout(() => {
      const opened = window.open(url, "_blank");
      if (!opened) {
        window.location.href = url;
      }
    }, 150);
  }

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ---------- Simple ASCII-safe PDF ----------
async function generatePDF(job) {
  const { PDFDocument, StandardFonts } = window.PDFLib;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 48;
  let y = 841.89 - 64;
  const lineGap = 6;

  function draw(text, size = 11, indent = 0) {
    page.drawText(String(text), { x: margin + indent, y, size, font });
    y -= (size + lineGap);
  }

  function section(title) {
    y -= 6;
    page.drawText(String(title), { x: margin, y, size: 14, font });
    y -= 20;
  }

  function isNonEmpty(v) {
    return v !== null && v !== undefined && String(v).trim() !== "";
  }

  function sanitizeNumeric(raw) {
    return String(raw || "").replace(/[^\d]/g, "");
  }

  function cardNonEmpty(obj) {
    return Object.values(obj).some((v) => isNonEmpty(v));
  }

  draw("Measurements Report", 18);
  y -= 8;

  section("Header");
  let headerPrinted = false;
  if (isNonEmpty(job?.header?.date)) { draw(`Date: ${job.header.date}`); headerPrinted = true; }
  if (isNonEmpty(job?.header?.address)) { draw(`Address: ${job.header.address}`); headerPrinted = true; }
  if (isNonEmpty(job?.header?.employeeSurname)) { draw(`Employee: ${job.header.employeeSurname}`); headerPrinted = true; }
  if (!headerPrinted) draw("-");

  // Doors
  const entrance = job?.doors?.entrance || {};
  const entrancePrintable = {
    depth: sanitizeNumeric(entrance.depth),
    height: sanitizeNumeric(entrance.height),
    width: sanitizeNumeric(entrance.width),
  };

  const interiorPrintable = (job?.doors?.interior || [])
    .map((d) => ({
      depth: sanitizeNumeric(d.depth),
      height: sanitizeNumeric(d.height),
      width: sanitizeNumeric(d.width),
    }))
    .filter(cardNonEmpty);

  const notesDoors = (job?.doors?.notes || "").trim();
  const doorsHasData = cardNonEmpty(entrancePrintable) || interiorPrintable.length > 0 || isNonEmpty(notesDoors);

  if (doorsHasData) {
    section("Doors");

    if (cardNonEmpty(entrancePrintable)) {
      draw("Entrance door", 12);
      if (isNonEmpty(entrancePrintable.depth)) draw(`Depth: ${entrancePrintable.depth} mm`, 11, 18);
      if (isNonEmpty(entrancePrintable.height)) draw(`Height: ${entrancePrintable.height} mm`, 11, 18);
      if (isNonEmpty(entrancePrintable.width)) draw(`Width: ${entrancePrintable.width} mm`, 11, 18);
      y -= 6;
    }

    if (interiorPrintable.length > 0) {
      draw("Interior doors", 12);
      interiorPrintable.forEach((d, i) => {
        draw(`Door ${i + 1}`, 11, 18);
        if (isNonEmpty(d.depth)) draw(`Depth: ${d.depth} mm`, 11, 36);
        if (isNonEmpty(d.height)) draw(`Height: ${d.height} mm`, 11, 36);
        if (isNonEmpty(d.width)) draw(`Width: ${d.width} mm`, 11, 36);
        y -= 6;
      });
    }

    if (isNonEmpty(notesDoors)) draw(`Notes: ${notesDoors}`);
  }

  // Windows
  const windowsPrintable = (job?.windows?.items || [])
    .map((w) => ({
      depth: sanitizeNumeric(w.depth),
      height: sanitizeNumeric(w.height),
      width: sanitizeNumeric(w.width),
      sill: sanitizeNumeric(w.sill),
    }))
    .filter(cardNonEmpty);

  const notesWindows = (job?.windows?.notes || "").trim();
  const windowsHasData = windowsPrintable.length > 0 || isNonEmpty(notesWindows);

  if (windowsHasData) {
    section("Windows");

    windowsPrintable.forEach((w, i) => {
      draw(`Window ${i + 1}`, 12);
      if (isNonEmpty(w.depth)) draw(`Depth: ${w.depth} mm`, 11, 18);
      if (isNonEmpty(w.height)) draw(`Height: ${w.height} mm`, 11, 18);
      if (isNonEmpty(w.width)) draw(`Width: ${w.width} mm`, 11, 18);
      if (isNonEmpty(w.sill)) draw(`Sill: ${w.sill} mm`, 11, 18);
      y -= 6;
    });

    if (isNonEmpty(notesWindows)) draw(`Notes: ${notesWindows}`);
  }

  // Radiators
  const radiatorsPrintable = (job?.radiators?.items || [])
    .map((r) => ({
      fromWall: sanitizeNumeric(r.fromWall),
      fromFloor: sanitizeNumeric(r.fromFloor),
      centerDistance: sanitizeNumeric(r.centerDistance),
    }))
    .filter(cardNonEmpty);

  const notesRadiators = (job?.radiators?.notes || "").trim();
  const radiatorsHasData = radiatorsPrintable.length > 0 || isNonEmpty(notesRadiators);

  if (radiatorsHasData) {
    section("Radiators");

    radiatorsPrintable.forEach((r, i) => {
      draw(`Radiator ${i + 1}`, 12);
      if (isNonEmpty(r.fromWall)) draw(`From wall: ${r.fromWall} mm`, 11, 18);
      if (isNonEmpty(r.fromFloor)) draw(`From floor: ${r.fromFloor} mm`, 11, 18);
      if (isNonEmpty(r.centerDistance)) draw(`Center distance: ${r.centerDistance} mm`, 11, 18);
      y -= 6;
    });

    if (isNonEmpty(notesRadiators)) draw(`Notes: ${notesRadiators}`);
  }

  page.drawText("Generated offline. Only filled fields are printed.", {
    x: margin,
    y: 28,
    size: 9,
    font,
  });

  return await pdfDoc.save();
}

// ---------- Init ----------
function init() {
  renderAll();

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
    alert("PDF error. Open console for details.");
  }
});const safeDate = (state.job.header.date || todayISO()).replaceAll("-", "");
    const safeSurname = (state.job.header.employeeSurname || "employee").trim() || "employee";
    const filename = `zamery_${safeDate}_${safeSurname}.pdf`;

    downloadPdfBlob(blob, filename);
  });
}

init();
