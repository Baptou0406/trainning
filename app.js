// -------------------------------
// Data (programme)
// -------------------------------
const PROGRAM = {
  "Push": [
    { name: "Développé couché", note: "4×6–8" },
    { name: "Développé incliné haltères", note: "3×8–10" },
    { name: "Pec Fly (machine/poulies)", note: "3×12–15" },
    { name: "Élévations latérales", note: "4×12–15" },
    { name: "Dips OU barre au front", note: "3×8–12" },
    { name: "Extensions triceps poulie", note: "3×12–15" }
  ],
  "Pull": [
    { name: "Tractions OU tirage vertical", note: "4×6–10" },
    { name: "Rowing barre/machine", note: "4×8–10" },
    { name: "Tirage horizontal poulie", note: "3×10–12" },
    { name: "Oiseau / arrière d’épaule", note: "3×12–15" },
    { name: "Curl barre", note: "3×8–10" },
    { name: "Curl incliné haltères", note: "3×10–12" }
  ],
  "Legs/Lower": [
    { name: "Squat OU presse", note: "4×6–10" },
    { name: "Fentes OU presse (variante)", note: "3×10–12" },
    { name: "Leg curl", note: "3×10–12" },
    { name: "Leg extension", note: "3×12–15" },
    { name: "Mollets", note: "4×12–20" },
    { name: "Gainage", note: "3×45–60s" }
  ],
  "Upper": [
    { name: "Développé incliné barre", note: "3×8" },
    { name: "Tirage vertical", note: "3×8–10" },
    { name: "Rowing machine", note: "3×10" },
    { name: "Élévations latérales", note: "3×15" },
    { name: "Curl poulie", note: "2×12" },
    { name: "Triceps poulie", note: "2×12" }
  ],
  "Lower (focus)": [
    { name: "Presse", note: "4×10" },
    { name: "SDT jambes tendues", note: "3×8–10" },
    { name: "Fentes marchées", note: "3×12" },
    { name: "Leg curl", note: "3×12" },
    { name: "Mollets", note: "4×15–20" },
    { name: "Gainage", note: "3×45–60s" }
  ]
};

// -------------------------------
// Storage
// -------------------------------
const STORAGE_KEY = "workout_tracker_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { values: {}, lastWorkout: "Push" };
    return JSON.parse(raw);
  } catch {
    return { values: {}, lastWorkout: "Push" };
  }
}

function saveState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  pingSaveStatus();
}

function pingSaveStatus() {
  const el = document.getElementById("saveStatus");
  el.textContent = "Sauvegarde : OK";
  el.style.opacity = "1";
  setTimeout(() => (el.style.opacity = "0.8"), 450);
}

// values structure:
// values[workoutName][exerciseName] = { kg, sets, reps }
const state = loadState();

// -------------------------------
// UI
// -------------------------------
const workoutSelect = document.getElementById("workoutSelect");
const exerciseList = document.getElementById("exerciseList");
const resetAllBtn = document.getElementById("resetAllBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

// Timers
const startWorkoutBtn = document.getElementById("startWorkoutBtn");
const endWorkoutBtn = document.getElementById("endWorkoutBtn");
const workoutTimerEl = document.getElementById("workoutTimer");

const restTimerEl = document.getElementById("restTimer");
const restStopBtn = document.getElementById("restStopBtn");

let workoutTimerInterval = null;
let workoutStartTs = null;

let restInterval = null;
let restRemaining = 0;

// -------------------------------
// Helpers
// -------------------------------
function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatMS(seconds) {
  const s = Math.max(0, seconds);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function ensureExerciseDefaults(workoutName, exerciseName) {
  if (!state.values[workoutName]) state.values[workoutName] = {};
  if (!state.values[workoutName][exerciseName]) {
    state.values[workoutName][exerciseName] = { kg: "", sets: "", reps: "" };
  }
}

function setLastWorkout(name) {
  state.lastWorkout = name;
  saveState(state);
}

function getCurrentWorkout() {
  return workoutSelect.value;
}

// -------------------------------
// Render
// -------------------------------
function renderWorkoutOptions() {
  workoutSelect.innerHTML = "";
  Object.keys(PROGRAM).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    workoutSelect.appendChild(opt);
  });

  if (PROGRAM[state.lastWorkout]) workoutSelect.value = state.lastWorkout;
  else workoutSelect.value = Object.keys(PROGRAM)[0];
}

function renderExercises() {
  const workoutName = getCurrentWorkout();
  const exercises = PROGRAM[workoutName] || [];
  setLastWorkout(workoutName);

  exerciseList.innerHTML = "";

  exercises.forEach((ex) => {
    ensureExerciseDefaults(workoutName, ex.name);
    const v = state.values[workoutName][ex.name];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="cardTop">
        <div>
          <div class="title">${ex.name}</div>
          <div class="sub">${ex.note}</div>
        </div>
        <div class="actions">
          <span class="pill">Tap pour modifier</span>
        </div>
      </div>

      <div class="grid">
        <div class="inputGroup">
          <label>Kg</label>
          <input inputmode="decimal" placeholder="ex: 80" value="${escapeHtml(v.kg)}" data-field="kg" />
        </div>
        <div class="inputGroup">
          <label>Séries</label>
          <input inputmode="numeric" placeholder="ex: 4" value="${escapeHtml(v.sets)}" data-field="sets" />
        </div>
        <div class="inputGroup">
          <label>Reps</label>
          <input inputmode="numeric" placeholder="ex: 8" value="${escapeHtml(v.reps)}" data-field="reps" />
        </div>
      </div>

      <div class="row" style="margin-top:10px;">
        <button class="btn btn--small" data-action="rest90">Repos 90s</button>
        <button class="btn btn--small btn--ghost" data-action="clear">Effacer</button>
      </div>
    `;

    // Input listeners
    card.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const field = inp.dataset.field;
        state.values[workoutName][ex.name][field] = inp.value;
        saveState(state);
      });
    });

    // Buttons
    card.querySelector('[data-action="rest90"]').addEventListener("click", () => startRest(90));
    card.querySelector('[data-action="clear"]').addEventListener("click", () => {
      state.values[workoutName][ex.name] = { kg: "", sets: "", reps: "" };
      saveState(state);
      renderExercises();
    });

    exerciseList.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------------------
// Timers
// -------------------------------
function startWorkoutTimer() {
  if (workoutTimerInterval) return;
  workoutStartTs = Date.now();
  startWorkoutBtn.disabled = true;
  endWorkoutBtn.disabled = false;

  workoutTimerInterval = setInterval(() => {
    workoutTimerEl.textContent = formatHMS(Date.now() - workoutStartTs);
  }, 250);
}

function stopWorkoutTimer() {
  if (!workoutTimerInterval) return;
  clearInterval(workoutTimerInterval);
  workoutTimerInterval = null;
  workoutStartTs = null;
  workoutTimerEl.textContent = "00:00:00";
  startWorkoutBtn.disabled = false;
  endWorkoutBtn.disabled = true;
}

function startRest(seconds) {
  stopRest();
  restRemaining = seconds;
  restTimerEl.textContent = formatMS(restRemaining);

  restInterval = setInterval(() => {
    restRemaining -= 1;
    restTimerEl.textContent = formatMS(restRemaining);

    if (restRemaining <= 0) {
      stopRest();
      buzz();
    }
  }, 1000);
}

function stopRest() {
  if (restInterval) clearInterval(restInterval);
  restInterval = null;
  restRemaining = 0;
  restTimerEl.textContent = "00:00";
}

function buzz() {
  // vibration mobile si dispo
  if (navigator.vibrate) navigator.vibrate([200, 120, 200]);
  // petit beep simple
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 250);
  } catch {}
}

// -------------------------------
// Export/Import
// -------------------------------
function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", () => {
  downloadJson("workout-tracker-export.json", state);
});

importInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || typeof imported !== "object") throw new Error("invalid");
    if (!imported.values) throw new Error("missing values");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    location.reload();
  } catch {
    alert("Import impossible : fichier invalide.");
  } finally {
    importInput.value = "";
  }
});

// -------------------------------
// Reset
// -------------------------------
resetAllBtn.addEventListener("click", () => {
  const ok = confirm("Réinitialiser toutes les charges/réps/séries ?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// -------------------------------
// Events
// -------------------------------
workoutSelect.addEventListener("change", renderExercises);

startWorkoutBtn.addEventListener("click", startWorkoutTimer);
endWorkoutBtn.addEventListener("click", stopWorkoutTimer);

document.querySelectorAll("[data-rest]").forEach((btn) => {
  btn.addEventListener("click", () => startRest(parseInt(btn.dataset.rest, 10)));
});
restStopBtn.addEventListener("click", stopRest);

// Init
renderWorkoutOptions();
renderExercises();
pingSaveStatus();
