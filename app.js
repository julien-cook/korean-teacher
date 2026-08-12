// Korean Teacher — app logic.
// Relies on `DECKS` from data.js (loaded before this script).

const STORAGE_KEY = "korean-teacher:v1";
const DEFAULT_DECK = "jamoBasic";

const $ = (id) => document.getElementById(id);
const els = {
  deck:          $("deck"),
  voice:         $("voice"),
  shuffle:       $("shuffle"),
  autoplay:      $("autoplay"),
  reshuffle:     $("reshuffle"),
  card:          $("card"),
  front:         $("front-text"),
  back:          $("back-text"),
  extra:         $("extra-text"),
  frontBack:     $("front-back-text"),
  frontExtra:    $("front-extra-text"),
  counter:       $("counter"),
  prev:          $("prev"),
  next:          $("next"),
  play:          $("play"),
  hint:          $("hint"),
  segButtons:    Array.from(document.querySelectorAll(".seg-btn")),
};

const state = {
  deckId: DEFAULT_DECK,
  mode: "test",        // "learn" | "test"
  cards: [],
  index: 0,
  flipped: false,
  shuffled: false,
  autoplay: false,
  voiceURI: "",        // empty = auto-pick
};

// ---------- persistence ----------

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (typeof p.deckId === "string" && DECKS[p.deckId]) state.deckId = p.deckId;
    if (p.mode === "learn" || p.mode === "test") state.mode = p.mode;
    if (typeof p.shuffled === "boolean") state.shuffled = p.shuffled;
    if (typeof p.autoplay === "boolean") state.autoplay = p.autoplay;
    if (typeof p.voiceURI === "string") state.voiceURI = p.voiceURI;
  } catch (_) { /* ignore malformed prefs */ }
}

function savePrefs() {
  const p = {
    deckId:   state.deckId,
    mode:     state.mode,
    shuffled: state.shuffled,
    autoplay: state.autoplay,
    voiceURI: state.voiceURI,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ---------- deck handling ----------

function populateDeckPicker() {
  els.deck.innerHTML = "";
  for (const [id, def] of Object.entries(DECKS)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = def.label;
    els.deck.appendChild(opt);
  }
  els.deck.value = state.deckId;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadDeck(id) {
  state.deckId = id;
  const built = DECKS[id].build();
  state.cards = state.shuffled ? shuffleInPlace(built.slice()) : built;
  state.index = 0;
  state.flipped = false;
  render();
}

// ---------- rendering ----------

function render() {
  const card = state.cards[state.index];
  if (!card) {
    els.front.textContent = "—";
    els.back.textContent = "—";
    els.extra.textContent = "";
    els.frontBack.textContent = "";
    els.frontExtra.textContent = "";
    els.counter.textContent = "— / —";
    return;
  }
  els.front.textContent      = card.front;
  els.back.textContent       = card.back;
  els.extra.textContent      = card.extra || "";
  els.frontBack.textContent  = card.back;
  els.frontExtra.textContent = card.extra || "";
  els.counter.textContent    = `${state.index + 1} / ${state.cards.length}`;
  els.card.dataset.mode      = state.mode;
  els.card.classList.toggle("flipped", state.mode === "test" && state.flipped);
  els.card.setAttribute("aria-pressed", String(state.flipped));
}

function applyMode() {
  state.flipped = false;
  for (const btn of els.segButtons) {
    const on = btn.dataset.mode === state.mode;
    btn.setAttribute("aria-checked", String(on));
  }
  els.hint.innerHTML = state.mode === "learn"
    ? 'Click the card to hear it · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>P</kbd> play audio'
    : 'Click the card to flip · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>Space</kbd> flip · <kbd>P</kbd> play audio';
  render();
}

// ---------- navigation ----------

function flip() {
  state.flipped = !state.flipped;
  render();
}

function goTo(delta) {
  if (!state.cards.length) return;
  state.index = (state.index + delta + state.cards.length) % state.cards.length;
  state.flipped = false;
  render();
  if (state.autoplay) speakCurrent();
}

// ---------- speech ----------

let koVoices = [];
let selectedVoice = null;

// Rank voices — prefer higher-quality variants (Siri, Premium, Enhanced, Neural) first.
function voiceScore(v) {
  const n = `${v.name} ${v.voiceURI || ""}`.toLowerCase();
  let s = 0;
  if (/siri/.test(n))                  s += 100;
  if (/premium/.test(n))               s += 80;
  if (/enhanced/.test(n))              s += 60;
  if (/neural|wavenet|studio/.test(n)) s += 50;
  if (/yuna/.test(n))                  s += 10;  // macOS default Korean, decent
  return s;
}

function refreshVoices() {
  if (!window.speechSynthesis) return;
  const all = speechSynthesis.getVoices();
  koVoices = all
    .filter((v) => /^ko(-|_|$)/i.test(v.lang))
    .sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
  populateVoicePicker();
  pickSelectedVoice();
}

function populateVoicePicker() {
  const prev = state.voiceURI;
  els.voice.innerHTML = "";
  if (!koVoices.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No Korean voice installed";
    els.voice.appendChild(opt);
    els.voice.disabled = true;
    return;
  }
  els.voice.disabled = false;
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = `Auto (best available: ${koVoices[0].name})`;
  els.voice.appendChild(auto);
  for (const v of koVoices) {
    const opt = document.createElement("option");
    opt.value = v.voiceURI || v.name;
    opt.textContent = `${v.name} — ${v.lang}${v.localService === false ? " · cloud" : ""}`;
    els.voice.appendChild(opt);
  }
  els.voice.value = prev && koVoices.some((v) => (v.voiceURI || v.name) === prev) ? prev : "";
}

function pickSelectedVoice() {
  if (!koVoices.length) { selectedVoice = null; return; }
  if (state.voiceURI) {
    selectedVoice = koVoices.find((v) => (v.voiceURI || v.name) === state.voiceURI) || koVoices[0];
  } else {
    selectedVoice = koVoices[0];
  }
}

// Held at module scope: a locally-scoped utterance can be garbage-collected
// mid-sentence in Chrome/Safari, which cuts the audio off part-way through.
let currentUtterance = null;

function speakCurrent() {
  if (!window.speechSynthesis) return;
  const card = state.cards[state.index];
  if (!card) return;
  const text = card.tts || card.front;
  if (!text) return;

  speechSynthesis.cancel();
  // cancel() is asynchronous internally; speaking in the same tick races it and
  // the new utterance is silently dropped. A zero-delay timeout is enough.
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = 0.9;
    currentUtterance = u;
    speechSynthesis.speak(u);
  }, 0);
}

if (window.speechSynthesis) {
  refreshVoices();
  // addEventListener, not onvoiceschanged: a bare property assignment is a single
  // slot, so any other script on the page that wants voices silently clobbers this.
  speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

// ---------- events ----------

els.deck.addEventListener("change", () => {
  loadDeck(els.deck.value);
  savePrefs();
});

for (const btn of els.segButtons) {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    applyMode();
    savePrefs();
  });
}

els.voice.addEventListener("change", () => {
  state.voiceURI = els.voice.value;
  pickSelectedVoice();
  savePrefs();
});

els.shuffle.addEventListener("change", () => {
  state.shuffled = els.shuffle.checked;
  loadDeck(state.deckId);
  savePrefs();
});

els.autoplay.addEventListener("change", () => {
  state.autoplay = els.autoplay.checked;
  savePrefs();
});

els.reshuffle.addEventListener("click", () => {
  // Rebuild the deck (regenerates random cards for Arabic decks; re-shuffles others if shuffle is on).
  loadDeck(state.deckId);
});

els.card.addEventListener("click", () => {
  if (state.mode === "learn") speakCurrent();
  else flip();
});
els.prev.addEventListener("click", (e) => { e.stopPropagation(); goTo(-1); });
els.next.addEventListener("click", (e) => { e.stopPropagation(); goTo(1); });
els.play.addEventListener("click", (e) => { e.stopPropagation(); speakCurrent(); });

document.addEventListener("keydown", (e) => {
  // Ignore when focus is in a form control.
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;

  switch (e.key) {
    case "ArrowLeft":  e.preventDefault(); goTo(-1); break;
    case "ArrowRight": e.preventDefault(); goTo(1);  break;
    case " ":
    case "Enter":
      e.preventDefault();
      if (state.mode === "learn") speakCurrent();
      else flip();
      break;
    case "p":
    case "P":          e.preventDefault(); speakCurrent(); break;
  }
});

// ---------- boot ----------

loadPrefs();
populateDeckPicker();
els.shuffle.checked = state.shuffled;
els.autoplay.checked = state.autoplay;
applyMode();
loadDeck(state.deckId);

// Service worker registration lives here rather than inline in index.html so that
// a Content-Security-Policy of `script-src 'self'` does not block it.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
