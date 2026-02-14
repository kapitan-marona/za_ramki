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
function generatePDF(job) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>
endobj
xref
0 4
0000000000 65535 f 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF`;

  return new TextEncoder().encode(content);
}

// ---------- Init ----------
function init() {
  renderAll();

  $("#downloadPdf").addEventListener("click", () => {
    const pdfBytes = generatePDF(state.job);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const safeDate = (state.job.header.date || todayISO()).replaceAll("-", "");
    const safeSurname = (state.job.header.employeeSurname || "employee").trim() || "employee";
    const filename = `zamery_${safeDate}_${safeSurname}.pdf`;

    downloadPdfBlob(blob, filename);
  });
}

init();
