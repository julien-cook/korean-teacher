// Korean Teacher — homework helper.
//
// Depends on DECKS (data.js) and HW / TASKS / buildLexicon / buildKnownSet /
// unknownWords / parseDay (homework-data.js), both loaded before this script.
//
// Security note: every piece of model output is rendered with textContent or
// createElement. Never innerHTML — a credential lives on this origin, so an
// HTML injection would be a token theft.

const HW_CFG_KEY = "korean-teacher:hw-config:v1";
const HW_DRAFT_KEY = "korean-teacher:hw-draft:v1";
const DEFAULT_MODEL = "grok-4.5";
const DEFAULT_BASE = "https://api.x.ai";

const $ = (id) => document.getElementById(id);

const el = {
  conn: $("hw-conn"),
  reload: $("hw-reload"),
  logBtn: $("hw-logbtn"),
  logPanel: $("hw-logpanel"),
  logBody: $("hw-logbody"),
  logCopy: $("hw-logcopy"),
  logClear: $("hw-logclear"),
  logClose: $("hw-logclose"),
  logStatus: $("hw-logstatus"),
  setup: $("hw-setup"),
  key: $("hw-key"),
  model: $("hw-model"),
  base: $("hw-base"),
  persona: $("hw-persona"),
  personaReset: $("hw-persona-reset"),
  voice: $("hw-voice"),
  call: $("hw-call"),
  callbar: $("hw-callbar"),
  orb: $("hw-orb"),
  callStatus: $("hw-callstatus"),
  mute: $("hw-mute"),
  hangup: $("hw-hangup"),
  remember: $("hw-remember"),
  save: $("hw-save"),
  clear: $("hw-clear"),
  probe: $("hw-probe"),
  task: $("hw-task"),
  promptKo: $("hw-prompt-ko"),
  promptEn: $("hw-prompt-en"),
  chips: $("hw-chips"),
  finish: $("hw-finish"),
  count: $("hw-count"),
  notice: $("hw-notice"),
  transcript: $("hw-transcript"),
  composer: $("hw-composer"),
  input: $("hw-input"),
  mic: $("hw-mic"),
  send: $("hw-send"),
  final: $("hw-final"),
  message: $("hw-message"),
  finalCount: $("hw-final-count"),
  envelope: $("hw-envelope"),
  english: $("hw-english"),
  copy: $("hw-copy"),
  share: $("hw-share"),
  playAll: $("hw-playall"),
  restart: $("hw-restart"),
  finalStatus: $("hw-final-status"),
  audio: $("hw-audio"),
};

const cfg = {
  key: "",                // the user's own xAI key, pasted at startup
  model: DEFAULT_MODEL,
  base: DEFAULT_BASE,
  persona: "",            // empty = use DEFAULT_PERSONA
  voice: "ara",
  remember: true,
  sttOk: false,
};

const task = TASKS.thisWeek;

const state = {
  // Sentences accumulate as they are accepted. No slots, no fixed order — the
  // student just talks and the list fills up.
  sentences: [],          // [{ day, ko, rr, en }]
  history: [],            // chat messages, excluding the system prompt
  busy: false,
  known: null,
};

// ---------- config persistence ----------

function loadCfg() {
  try {
    const raw = localStorage.getItem(HW_CFG_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    for (const k of ["key", "model", "base", "persona", "voice"]) {
      if (typeof p[k] === "string") cfg[k] = p[k];
    }
    if (typeof p.remember === "boolean") cfg.remember = p.remember;
    if (typeof p.sttOk === "boolean") cfg.sttOk = p.sttOk;
  } catch (_) { /* ignore malformed config */ }
}

function saveCfg() {
  if (!cfg.remember) {
    localStorage.removeItem(HW_CFG_KEY);
    return;
  }
  localStorage.setItem(HW_CFG_KEY, JSON.stringify(cfg));
}

function isConfigured() {
  return Boolean(cfg.key);
}

// ---------- transport ----------

// Returns { url, headers } for a given API path. The key goes straight from
// this browser to xAI; nothing sits in between.
function endpoint(path, extraHeaders) {
  const headers = Object.assign({}, extraHeaders || {});
  headers["Authorization"] = "Bearer " + cfg.key;
  return { url: (cfg.base || DEFAULT_BASE).replace(/\/+$/, "") + path, headers };
}

// A fetch that fails with a message a human can act on. A bare "TypeError:
// Failed to fetch" covers CORS, DNS, offline and airplane mode identically, and
// sending someone to debug CORS when their train wifi dropped wastes an evening.
async function apiFetch(path, init, label) {
  const { url, headers } = endpoint(path, (init && init.headers) || {});
  let res;
  try {
    res = await fetch(url, Object.assign({}, init, { headers }));
  } catch (err) {
    if (!navigator.onLine) throw new Error("You're offline. Reconnect and try again.");
    // A bare "Failed to fetch" covers CORS, DNS, offline and airplane mode
    // identically. Name the likely cause rather than leaving it cryptic.
    throw new Error(
      `Couldn't reach xAI for ${label || "that request"}. The browser gave no detail, which ` +
      `almost always means one of two things:\n\n` +
      `1. xAI refused a request straight from a web page (a CORS block). If ${label || "this"} ` +
      `is chat, that is the known limitation — the speech endpoints usually still work.\n` +
      `2. The network dropped.\n\n` +
      `Open the browser console for the real error.`
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const text = await res.clone().text();
      detail = text.slice(0, 400);
    } catch (_) { /* body already consumed or empty */ }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `xAI rejected the key (${res.status}). Check it is current, has credit, and — for ` +
        `speech — that voice is enabled for your team on console.x.ai.`
      );
    }
    if (res.status === 429) throw new Error("Rate limited (429). Wait a moment and try again.");
    throw new Error(`${label || "API"} error ${res.status}. ${detail}`);
  }
  return res;
}

// Streams a chat completion, calling onDelta with each text chunk.
async function chat(messages, onDelta) {
  const body = {
    model: cfg.model || DEFAULT_MODEL,
    messages,
    stream: true,
    temperature: 0.6,
  };
  const res = await apiFetch("/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, "chat");

  // Some proxies strip SSE. If we didn't get a stream, fall back to plain JSON.
  const ctype = res.headers.get("content-type") || "";
  if (!res.body || ctype.includes("application/json")) {
    const data = await res.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message &&
                  data.choices[0].message.content) || "";
    if (text && onDelta) onDelta(text);
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        const piece = delta && delta.content;
        if (piece) {
          full += piece;
          if (onDelta) onDelta(piece);
        }
      } catch (_) { /* partial JSON across chunk boundary; ignore */ }
    }
  }
  return full;
}

// ---------- prompt assembly ----------

function verbTable() {
  return HW.verbs.map(([d, p, e]) => `${d}→${p} ${e}`).join(" · ");
}

function descriptiveTable() {
  return HW.descriptives.map(([f, e]) => `${f} ${e}`).join(" · ");
}

function taskBlock() {
  const p = progress();
  const covered = [...daysCovered()];
  return [
    "## TASK: this week's homework",
    `Teacher's prompt: ${task.teacher.ko} ("${task.teacher.en}")`,
    task.brief,
    `Progress: ${p.intro}/3 self-introduction, ${p.week}/5 days.`,
    covered.length
      ? `Days already covered: ${covered.join(" ")} — do not repeat these.`
      : "No days covered yet.",
    `Weekday names: ${WEEKDAYS.map(([ko, en]) => `${ko} ${en}`).join(" · ")}`,
    `Target shape for a diary sentence: ${task.shape}`,
    "",
    "For the self-introduction part he needs: name, nationality, job. He already has",
    "cards for 저는 ...이에요/예요, 영국사람, UX디자이너, so those sentences should be easy",
    "wins — do not over-complicate them.",
    "",
    "Verb table for this task (dictionary → past polite → English). These count as KNOWN:",
    verbTable(),
    "Descriptive past he can reuse (all take 이/가, never 을/를):",
    descriptiveTable(),
    "Note: 아침 / 점심 / 저녁 are both the time of day AND the meal — 점심을 먹었어요 = \"I ate lunch\".",
    "",
    "Level-up ladder, in order — offer the next unused rung only:",
    task.levelUpLadder.join(" → "),
  ].join("\n");
}

function systemPrompt() {
  return `${persona()}

Everything below is HOW you teach. The character above is only how you sound — if the
two ever conflict, the rules below win.

You are helping ONE specific beginner, Julien, write his weekly homework for his Korean
class. You know exactly what he has studied, because his flashcard decks are listed below.

## THE TASK
Every week his teacher asks:
${task.teacher.ko}  ("${task.teacher.en}")
He replies with a text message of FIVE sentences, one per day. That message is the only
deliverable. Everything you do serves those five sentences.

Note on the prompt: 하셨나요 = 하 + 시 (honorific, aimed AT HIM) + 었 (past) + 나요. He must
RECOGNISE it but must NEVER use 하셨어요 / 드셨어요 / 계셨어요 about himself. He answers in
plain 해요체 past: -았어요 / -었어요 / 했어요.

## THE STUDENT
- 줄리엔 (Julien). British (영국사람), a UX designer (UX디자이너), living outside Korea.
- Native English speaker. He talks to you in English. Use British spellings and idiom.
- Level TOPIK 1 / A1, roughly week five. He reads Hangul fluently — never substitute
  romanisation for Hangul.
- He is writing on a phone and has no Korean keyboard. He will not type Hangul at you.

### What he can ALREADY do — this is from real homework he submitted, not guesswork
Do NOT teach him these. Teaching him what he already does correctly is patronising and
wastes the reply.
- **Past polite tense. He has this.** He produced 갔어요, 했어요, 마셨어요, 먹었어요 unaided
  and all four were correct. Never explain how to form -았어요/-었어요 unless he asks.
- The clause type A은/는 B이에요/예요 and its negation A이/가 아니에요.
- The 받침 rule, cold. 은/는, 이/가, 이에요/예요 all alternate on it.
- 저는 as a sentence topic. He uses it correctly, if repetitively.
- The object particle — SOMETIMES. He wrote 숙제를 correctly.
- Time 에 — SOMETIMES. He wrote 일요일에, 월요일에, 목요일에 correctly.
- ~450 concrete nouns (the lexicon below), the numbers, all seven weekday names.
- 저/나, 제/내, 저희/우리, the 씨 suffix.

### His ACTUAL gaps — target these, in this order
${OBSERVED_ERRORS.map((e) => "- " + e).join("\n")}

The single highest-value corrections are **을/를** and **에서**, because he is inconsistent
rather than ignorant: he already produces them sometimes, so he needs the rule made
explicit, not introduced from scratch.

Still genuinely new: 에서, subject 이/가 outside 아니에요, 도, 하고/랑 placement, 그리고,
그래서, -고, 안-negation.

## HOW TO TEACH
Lead with transfer, not with new rules.
- 을/를 IS the 받침 rule he already mastered for 은/는. Say that. Same for 이/가.
- When he drops a particle, do not re-teach the verb — he got the verb right. Point at the
  one missing particle and move on.
Teach AT MOST ONE new point per reply, in at most two short lines of English.
Praise what was already right before correcting anything — and be specific about it, since
with this student the verb is usually already correct.
Never print a grammar table. Never lecture. If he doesn't ask why, don't explain why.

## CONVERSATION RULES — FOLLOW EXACTLY
1. This is a CONVERSATION, not a form. He talks about whatever he likes, in any order.
   There is no day picker and no fixed sequence — YOU work out which day a sentence
   belongs to from what he says, and you keep track of which days are still missing.
2. ONE SENTENCE AT A TIME. If he describes three days at once, take the first, draft it,
   and say in half a line that you'll come back to the rest.
3. Each of his messages begins with a control line like [3 of 8 done · still needed:
   self-intro ×1, days ×4]. That is the app telling you where he is. Use it to decide what
   to ask for next. Never repeat it back to him.
4. Ask exactly ONE question per reply.
4. Under 120 words of English per reply. Short, warm, conversational. No headings, no
   bullet walls, no emoji spam.
5. He writes to you in English and is NOT expected to produce Korean himself — you draft
   it, he approves it. If he does offer Korean, praise what's right first, then fix in one
   line.
6. If what he says is vague ("just worked"), ask ONE concrete follow-up — where? with who?
   what did you eat? — so the sentence has something in it. Do not interrogate.
7. Hangul first, romanisation underneath, never romanisation alone.
8. The app adds the greeting and sign-off to the final message itself. Do NOT put
   안녕하세요 or 감사합니다 inside a sentence.

## THE BLOCK YOU MUST EMIT
Every drafted sentence MUST appear in this exact block, exactly ONCE per reply, on its own
lines:

<<<DAY
day: 월요일
ko: 월요일에 회사에서 일했어요.
rr: woryoire hoesaeseo ilhaesseoyo.
en: On Monday I worked at the office.
>>>

- \`day\` is the Korean weekday if the sentence is about a specific day; otherwise the label
  \`소개\` for a self-introduction sentence.
- \`ko\` is exactly what he will send his teacher. One or two sentences, 5-9 words each.
- \`rr\` is Revised Romanisation OF THE PRONUNCIATION: word-spaced, lower case, no hyphens,
  no diacritics. 월요일에 → woryoire. 밥을 → babeul. 식당에서 → sikdangeseo. 좋았어요 → joasseoyo.
- \`en\` is a plain English gloss.
- Two OPTIONAL extra lines, each once, comma-separated:
    new: 회의 (meeting), 지하철 (subway)     ← any word NOT in the lexicon below
    tag: particle-place, tense              ← what you corrected, from: particle-object,
         particle-subject, particle-place, particle-time, tense, irregular, honorific,
         wordorder, negation, connective, spelling, vocab
- Your teaching note goes BEFORE or AFTER the block, never inside it.

## KOREAN THE SENTENCES MUST OBEY

Register: 해요체 past for the diary sentences. Never 합니다체 there, never 반말, never the
honorific 시 about him.

Word order: [Time] [Place+에/에서] [Object+을/를] [Verb-past]
   월요일에 · 식당에서 · 밥을 · 먹었어요

### Past tense — the only tense he should produce
Stem = dictionary form minus 다. Then:
- Last stem vowel ㅏ or ㅗ → +았어요. Any other vowel → +었어요. Every 하다 verb → 했어요.
- Contract ONLY when the stem ends in a bare vowel with no 받침: 가→갔어요, 오→왔어요,
  보→봤어요, 만나→만났어요, 마시→마셨어요, 배우→배웠어요, 되→됐어요, 보내→보냈어요.
- 받침 present → NEVER contract: 먹→먹었어요, 읽→읽었어요, 받→받았어요, 앉→앉았어요.
- 으-drop: 쓰다→썼어요, 바쁘다→바빴어요, 예쁘다→예뻤어요.
- ㄷ→ㄹ: 듣다→들었어요, 걷다→걸었어요. (받다 is regular → 받았어요.)
- ㅂ-irregular, mostly descriptives: 춥다→추웠어요, 덥다→더웠어요, 어렵다→어려웠어요,
  쉽다→쉬웠어요, 맵다→매웠어요. But 입다→입었어요 and 좁다→좁았어요 are REGULAR.
- 르-irregular: 빠르다→빨랐어요, 다르다→달랐어요, 모르다→몰랐어요.
- 있다 / 없다 / 맛있다 / 재미있다 are REGULAR: 있었어요, 없었어요, 맛있었어요, 재미있었어요.
- Copula past: N+이었어요 after 받침 / N+였어요 after a vowel.
- Negation: 안 goes immediately before the verb — 안 갔어요, 안 먹었어요.
  ACTION noun+하다 verbs SPLIT: 공부 안 했어요 ✅ / 안 공부했어요 ❌.
  DESCRIPTIVE 하다 words NEVER split: 안 피곤했어요 ✅ / 피곤 안 했어요 ❌.
  재미있다 negates as 재미없었어요, not 안 재미있었어요.

### Particles
- Object 을 after a 받침, 를 after a vowel. 밥을 책을 옷을 / 영화를 친구를 커피를.
- Subject 이 after a 받침, 가 after a vowel — SAME 받침 rule he already owns.
  좋다 · 맛있다 · 재미있다 · 있다 · 없다 take 이/가 and NEVER 을/를:
    영화가 재미있었어요 ✅ / 영화를 재미있었어요 ❌ · 커피가 맛있었어요 · 날씨가 좋았어요
  He has only ever met 이/가 inside 아니에요. The FIRST time you use it, add one line:
  "이/가 marks the subject — same 받침 rule as 은/는."
- 은/는 marks what the sentence is ABOUT. In a diary 저는 is dropped after the first
  sentence, so most of the time you want 을/를 or 이/가, not 은/는.
- 에 = where he WENT or where he WAS. 에서 = where an action HAPPENED, and also "from".
  The test: MOVED there → 에. DID something there → 에서.
- Time nouns take 에: 월요일에, 아침에, 저녁에, 주말에. But 오늘, 어제, 내일, 지금, 매일
  NEVER take 에. Stack big→small: 금요일 저녁에.
- 도 REPLACES 은/는/이/가/을/를, never stacks: 커피도 마셨어요 ✅, 커피를도 ❌.
- 하고 joins NOUNS: 친구하고, 밥하고 국을.
- 만나다 takes 을/를, not 에: 친구를 만났어요.
- Don't double a 하다-compound's object: 한국어를 공부했어요 ✅, 공부를 공부했어요 ❌.

### Joining sentences — LEVEL-UP LAYER ONLY
Offer only after a day's plain sentence is agreed, and only one at a time.
- 그리고 / 그래서 start a NEW sentence.
- -고 joins two verbs inside ONE sentence, attached to the PLAIN stem, tense marked only at
  the end: 밥을 먹고 커피를 마셨어요 ✅. 먹었고 ❌.
Do NOT use -아서/어서, -는데, -다가, or -았었- at all.

## VOCABULARY — HARD CONSTRAINT
The lexicon below is every word this student has a card for. Build sentences from it, plus
the verb table in the task block, plus these task words which are licensed here even though
he has no card for them — use them freely, but never tell him he already knows them:
  공부, 일, 청소, 운동, 주말, 음악
- Prefer a word he knows over a better word. 좋았어요 he knows beats 훌륭했어요 he doesn't.
- If a sentence genuinely needs a word NOT in the lexicon or that list, you may use it —
  but you MUST put it on the \`new:\` line with a gloss and add one short sentence
  afterwards, e.g. "회의 (meeting) is a new word — your teacher hasn't taught it yet."
  Never smuggle in an unlisted word.
- If his English says something you cannot say with his vocabulary, say so and offer the
  nearest thing you CAN say.

### LEXICON — every word this student has a card for
${buildLexicon()}

## MISTAKES TO PRE-EMPT
He will reach for: 밥은 먹었어요 (→ 밥을) · 영화를 재미있었어요 (→ 영화가) · 학교에서 갔어요
(→ 학교에) · 집에 쉬었어요 (→ 집에서) · 저는 at the head of every sentence (drop it after the
first) · 어제에 / 오늘에 (→ 어제 / 오늘) · 안 공부했어요 (→ 공부 안 했어요) · 피곤 안 했어요
(→ 안 피곤했어요) · 하셨어요 about himself (→ 했어요) · 먹었고 (→ 먹고) · 커피를도 (→ 커피도) ·
듣었어요 (→ 들었어요) · 쓰었어요 (→ 썼어요) · 춥었어요 (→ 추웠어요) · 빠르었어요 (→ 빨랐어요).
If he proposes one, correct it in ONE line, tag it, and move on.

${taskBlock()}

## FLOW
When a day is approved, give one short line of encouragement and immediately ask about the
next day. After the last day is approved, do NOT emit another block — say the message is
ready and tell him to hit Copy. The app assembles the greeting, the sentences and the
sign-off for him.`;
}

// ---------- progress ----------

// A self-introduction sentence is tagged 소개 by the tutor; anything with a
// weekday name counts towards the five diary sentences.
function isIntro(s) {
  return !WEEKDAYS.some(([ko]) => (s.day || "").includes(ko));
}

function progress() {
  const intro = state.sentences.filter(isIntro).length;
  const week = state.sentences.length - intro;
  const parts = {};
  for (const p of task.parts) parts[p.id] = p.target;
  return {
    intro, week,
    introLeft: Math.max(0, parts.intro - intro),
    weekLeft: Math.max(0, parts.week - week),
    total: state.sentences.length,
    done: state.sentences.length >= task.target,
  };
}

function daysCovered() {
  const seen = new Set();
  for (const s of state.sentences) {
    for (const [ko] of WEEKDAYS) if ((s.day || "").includes(ko)) seen.add(ko);
  }
  return seen;
}

// ---------- rendering ----------

function scrollDown() {
  requestAnimationFrame(() => {
    el.transcript.scrollTop = el.transcript.scrollHeight;
  });
}

// A bubble with an inline action — used to offer the log at the exact moment
// something has just gone wrong, rather than making you go and find it.
function addBubbleWithAction(who, text, label, fn) {
  const div = document.createElement("div");
  div.className = "bubble " + who;
  const p = document.createElement("div");
  p.textContent = text;
  div.appendChild(p);
  const btn = document.createElement("button");
  btn.className = "mini";
  btn.style.marginTop = "8px";
  btn.textContent = label;
  btn.addEventListener("click", () => fn(btn));
  div.appendChild(btn);
  el.transcript.appendChild(div);
  scrollDown();
  return div;
}

function addBubble(who, text) {
  const div = document.createElement("div");
  div.className = "bubble " + who;
  div.textContent = text;
  el.transcript.appendChild(div);
  scrollDown();
  return div;
}

// A read-only progress strip. There is nothing to pick and nothing to configure —
// it just shows how full the list is.
function renderProgress() {
  const p = progress();
  el.chips.textContent = "";
  for (const part of task.parts) {
    const have = part.id === "intro" ? p.intro : p.week;
    const chip = document.createElement("span");
    chip.className = "hw-chip";
    chip.textContent = `${part.label} ${Math.min(have, part.target)}/${part.target}`;
    if (have >= part.target) chip.dataset.state = "done";
    el.chips.appendChild(chip);
  }
  el.count.textContent = `${p.total} / ${task.target}`;

  const covered = daysCovered();
  el.notice.hidden = covered.size === 0;
  if (covered.size) {
    el.notice.textContent = "Days so far: " + [...covered].join(" · ");
  }

  el.finish.hidden = state.sentences.length === 0;
  el.finish.textContent = p.done ? "Finish ✓" : `Finish (${p.total})`;
}

function renderDayCard(day, opts) {
  const accepted = opts && opts.accepted;
  const card = document.createElement("div");
  card.className = "day-card";

  const dayLine = document.createElement("div");
  dayLine.className = "dc-day";
  dayLine.textContent = day.day || "";
  card.appendChild(dayLine);

  const ko = document.createElement("div");
  ko.className = "dc-ko";
  ko.textContent = day.ko;
  card.appendChild(ko);

  if (day.rr) {
    const rr = document.createElement("div");
    rr.className = "dc-rr";
    rr.textContent = day.rr;
    card.appendChild(rr);
  }
  if (day.en) {
    const en = document.createElement("div");
    en.className = "dc-en";
    en.textContent = day.en;
    card.appendChild(en);
  }

  // Words the model introduced, plus anything our own check spotted that the
  // model failed to declare.
  const declared = day.newWords || [];
  const spotted = unknownWords(day.ko, state.known).filter(
    (w) => !declared.some((d) => d.startsWith(w) || w.startsWith(d.split(" ")[0]))
  );
  if (declared.length || spotted.length) {
    const box = document.createElement("div");
    box.className = "dc-new";
    const parts = [];
    if (declared.length) parts.push("New: " + declared.join(", "));
    if (spotted.length) parts.push("Not on a card yet: " + spotted.join(", "));
    box.textContent = parts.join(" · ");
    card.appendChild(box);
  }

  const actions = document.createElement("div");
  actions.className = "dc-actions";

  const speak = document.createElement("button");
  speak.className = "mini";
  speak.textContent = "🔊";
  speak.addEventListener("click", () => speakKo(day.ko));
  actions.appendChild(speak);

  if (!accepted) {
    const use = document.createElement("button");
    use.className = "mini hw-primary";
    use.textContent = "Use this";
    use.addEventListener("click", () => {
      acceptSentence(day);
      use.disabled = true;
      use.textContent = "Added ✓";
      for (const b of actions.querySelectorAll("button")) {
        if (b !== use && b.textContent !== "\u{1F50A}") b.remove();
      }
    });
    actions.appendChild(use);

    for (const [label, msg] of [
      ["Simpler", "That's a bit much — can you make it simpler?"],
      ["Level up", "Can you level that sentence up one notch?"],
    ]) {
      const b = document.createElement("button");
      b.className = "mini";
      b.textContent = label;
      b.addEventListener("click", () => send(msg));
      actions.appendChild(b);
    }
  }

  card.appendChild(actions);
  el.transcript.appendChild(card);
  scrollDown();
}

// ---------- blank check ----------

// Finds a particle in the sentence we have a distractor table for, and blanks it.
function makeBlankCheck(ko) {
  const candidates = [];
  for (const p of Object.keys(HW.distractors)) {
    const re = new RegExp("([가-힣]+)" + p + "(?=\\s|$)", "g");
    let m;
    while ((m = re.exec(ko)) !== null) {
      candidates.push({ particle: p, index: m.index + m[1].length, stem: m[1] });
    }
  }
  if (!candidates.length) return null;
  // Deterministic pick: the last one, which is usually the most contentful.
  const pick = candidates[candidates.length - 1];
  const opts = [pick.particle, ...(HW.distractors[pick.particle] || [])];
  // Deterministic shuffle by stem length, so it isn't always first.
  opts.sort((a, b) => ((a + pick.stem).length % 3) - ((b + pick.stem).length % 3));
  return { pick, opts: [...new Set(opts)] };
}

function tagForParticle(p) {
  if (p === "에" || p === "에서") return "particle-place";
  if (p === "을" || p === "를") return "particle-object";
  if (p === "이" || p === "가") return "particle-subject";
  return "particle-time";
}

function renderBlankCheck(ko, onDone) {
  const bc = makeBlankCheck(ko);
  if (!bc) { onDone(); return; }

  const box = document.createElement("div");
  box.className = "blankcheck";

  const q = document.createElement("div");
  q.className = "bc-q";
  q.textContent = "Quick check — tap the right one:";
  box.appendChild(q);

  const line = document.createElement("div");
  line.className = "bc-sentence";
  line.appendChild(document.createTextNode(ko.slice(0, bc.pick.index)));
  const slot = document.createElement("span");
  slot.className = "bc-slot";
  slot.textContent = "  ?  ";
  line.appendChild(slot);
  line.appendChild(document.createTextNode(ko.slice(bc.pick.index + bc.pick.particle.length)));
  box.appendChild(line);

  const opts = document.createElement("div");
  opts.className = "bc-opts";
  let answered = false;

  for (const opt of bc.opts) {
    const b = document.createElement("button");
    b.className = "bc-opt";
    b.type = "button";
    b.textContent = opt;
    b.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const right = opt === bc.pick.particle;
      for (const other of opts.querySelectorAll(".bc-opt")) {
        other.dataset.verdict = other.textContent === bc.pick.particle ? "right" : "wrong";
      }
      slot.textContent = bc.pick.particle;
      if (!right) {
        const why = document.createElement("div");
        why.className = "bc-why";
        why.textContent = HW.whyLines[tagForParticle(bc.pick.particle)] || "";
        box.appendChild(why);
      }
      // Never blocks: right or wrong, we move on.
      setTimeout(onDone, right ? 350 : 1400);
    });
    opts.appendChild(b);
  }
  box.appendChild(opts);
  el.transcript.appendChild(box);
  scrollDown();
}

// ---------- speech out ----------

let currentUtterance = null;

function speakKo(text) {
  if (!window.speechSynthesis || !text) return;
  speechSynthesis.cancel();
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.9;
    currentUtterance = u;          // module scope: a local would be GC'd mid-sentence
    speechSynthesis.speak(u);
  }, 0);
}

function speakSequence(lines) {
  if (!window.speechSynthesis || !lines.length) return;
  speechSynthesis.cancel();
  let i = 0;
  const next = () => {
    if (i >= lines.length) return;
    const u = new SpeechSynthesisUtterance(lines[i++]);
    u.lang = "ko-KR";
    u.rate = 0.9;
    u.onend = () => setTimeout(next, 400);
    currentUtterance = u;
    speechSynthesis.speak(u);
  };
  setTimeout(next, 0);
}

// iOS wedges the synthesiser if the app is backgrounded mid-utterance.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.speechSynthesis) speechSynthesis.cancel();
});

// ---------- conversation ----------

function controlLine() {
  const p = progress();
  const bits = [`${p.total} of ${task.target} done`];
  const need = [];
  if (p.introLeft) need.push(`self-intro x${p.introLeft}`);
  if (p.weekLeft) need.push(`days x${p.weekLeft}`);
  bits.push(need.length ? "still needed: " + need.join(", ") : "all done, wrap up");
  return `[${bits.join(" \u00b7 ")}]\n`;
}

async function send(userText, opts) {
  if (state.busy) return;
  const silent = opts && opts.silent;
  const text = String(userText || "").trim();
  if (!text) return;

  state.busy = true;
  el.send.disabled = true;
  if (!silent) addBubble("user", text);

  const outbound = controlLine() + text;
  state.history.push({ role: "user", content: outbound });

  const bot = addBubble("bot", "");
  bot.classList.add("hw-typing");
  let acc = "";

  try {
    await chat(
      [{ role: "system", content: systemPrompt() }, ...state.history],
      (piece) => {
        acc += piece;
        // Show prose only; the block is rendered as a card once complete.
        bot.textContent = acc.replace(/<<<DAY[\s\S]*?(>>>|$)/, "").trim();
        scrollDown();
      }
    );
  } catch (err) {
    bot.classList.remove("hw-typing");
    bot.classList.add("err");
    bot.textContent = err.message;
    state.busy = false;
    el.send.disabled = false;
    state.history.pop();
    return;
  }

  bot.classList.remove("hw-typing");
  state.history.push({ role: "assistant", content: acc });

  const { prose, day } = parseDay(acc);
  bot.textContent = prose;
  if (!prose) bot.remove();
  if (day) renderDayCard(day);

  saveDraft();
  state.busy = false;
  el.send.disabled = false;
}

function acceptSentence(day, opts) {
  const fromCall = opts && opts.fromCall;

  // Independent of the call_id guard: the same Korean sentence is never wanted
  // twice in one homework message, whatever route it arrived by.
  const already = state.sentences.some((s) => s.ko.trim() === String(day.ko).trim());
  if (already) {
    logEvent("save", "duplicate sentence ignored: " + day.ko);
    return false;
  }

  state.sentences.push({
    day: day.day || "",
    ko: day.ko,
    rr: day.rr || "",
    en: day.en || "",
  });
  renderProgress();
  saveDraft();
  logEvent("save", (day.day || "?") + " | " + day.ko);

  const p = progress();

  // On a call the teacher is already talking, so a written quiz mid-sentence
  // would be noise and a follow-up chat turn would talk over her.
  if (fromCall) {
    renderDayCard(day, { accepted: true });
    if (p.done) showFinal();
    return true;
  }

  renderBlankCheck(day.ko, () => {
    if (p.done) {
      addBubble("bot", "That's everything. Hit Finish when you're ready and I'll put the message together.");
      showFinal();
      return;
    }
    // No scripted next-step: the tutor decides what to ask for, from the
    // control line. The app only nudges the conversation along.
    send("Added. What next?", { silent: true });
  });
  return true;
}

function startConversation() {
  el.composer.hidden = false;
  addBubble(
    "bot",
    "Tell me about your week and I'll turn it into Korean — one sentence at a time.\n\n" +
    "We need a short self-introduction and five days. Start wherever you like: " +
    "just say what you did, in English."
  );
  el.input.focus();
}

// ---------- final message ----------

function buildMessage() {
  const lines = [];
  if (el.envelope.checked) lines.push(...task.greeting, "");
  // Self-introduction sentences first, then the diary, which is how the teacher
  // asked for it.
  const ordered = [...state.sentences.filter(isIntro), ...state.sentences.filter((s) => !isIntro(s))];
  for (const r of ordered) {
    lines.push(r.ko);
    if (el.english.checked && r.en) lines.push(r.en);
    if (el.english.checked) lines.push("");
  }
  if (!el.english.checked) lines.push("");
  if (el.envelope.checked) lines.push(...task.signoff);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function showFinal() {
  // Move it into the transcript so it arrives as the last thing in the
  // conversation, above the composer, rather than as a slab underneath it.
  if (el.final.parentNode !== el.transcript) el.transcript.appendChild(el.final);
  el.final.hidden = false;
  el.finalCount.textContent = `${state.sentences.length} / ${task.target}`;
  el.message.value = buildMessage();
  scrollDown();
  saveDraft();
}

// ---------- draft persistence ----------

function saveDraft() {
  try {
    localStorage.setItem(HW_DRAFT_KEY, JSON.stringify({
      sentences: state.sentences,
      history: state.history.slice(-24),
    }));
  } catch (_) { /* quota; a lost draft is survivable */ }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(HW_DRAFT_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!Array.isArray(d.sentences) || !d.sentences.length) return false;
    state.sentences = d.sentences;
    state.history = Array.isArray(d.history) ? d.history : [];
    return true;
  } catch (_) { return false; }
}

function clearDraft() {
  localStorage.removeItem(HW_DRAFT_KEY);
  state.sentences = [];
  state.history = [];
  // Pull the final panel out BEFORE wiping the transcript — it lives inside it
  // once shown, and clearing textContent would destroy the node and every
  // listener bound to it.
  if (el.final.parentNode === el.transcript) el.transcript.removeChild(el.final);
  el.final.hidden = true;
  el.transcript.textContent = "";
  renderProgress();
}

// ---------- setup panel ----------

function showSetup(show) {
  el.setup.hidden = !show;
  el.task.hidden = show;
  el.conn.hidden = show;
  if (!show) {
    // Always show where the key is being sent. If this ever reads as anything
    // other than api.x.ai, something has redirected it.
    el.conn.textContent = "→ " + new URL(cfg.base || DEFAULT_BASE).host;
    el.conn.hidden = false;
  }
}

function fillSetup() {
  el.key.value = cfg.key;
  el.model.value = cfg.model || DEFAULT_MODEL;
  el.base.value = cfg.base || DEFAULT_BASE;
  el.persona.value = cfg.persona || DEFAULT_PERSONA;
  el.voice.value = cfg.voice || "ara";
  el.remember.checked = cfg.remember;
}

function readSetup() {
  cfg.key = el.key.value.trim();
  cfg.model = el.model.value.trim() || DEFAULT_MODEL;
  cfg.base = el.base.value.trim() || DEFAULT_BASE;
  cfg.persona = el.persona.value.trim();
  cfg.voice = el.voice.value || "ara";
  cfg.remember = el.remember.checked;
}

function persona() {
  return cfg.persona || DEFAULT_PERSONA;
}

function probeMsg(text, cls) {
  el.probe.textContent = text;
  el.probe.className = "hw-probe" + (cls ? " " + cls : "");
}

async function probeTransport() {
  readSetup();

  if (!cfg.key) { probeMsg("Paste your xAI key first.", "err"); return false; }
  if (!/^https:\/\//i.test(cfg.base)) { probeMsg("API base must start with https://", "err"); return false; }

  probeMsg("Checking your key…");
  try {
    await chat(
      [{ role: "user", content: "Reply with the single word: ok" }],
      null
    );
  } catch (err) {
    probeMsg("Couldn't start. " + err.message, "err");
    return false;
  }

  probeMsg("Key works. Checking the microphone…");
  try {
    const wav = silentWav(0.2);
    const fd = new FormData();
    fd.append("file", wav, "probe.wav");
    await apiFetch("/v1/stt", { method: "POST", body: fd }, "speech-to-text");
    cfg.sttOk = true;
    probeMsg("All set — typing and the microphone both work.", "ok");
  } catch (_) {
    cfg.sttOk = false;
    probeMsg("All set. The microphone isn't available, so type instead.", "ok");
  }

  saveCfg();
  el.mic.hidden = !cfg.sttOk;
  return true;
}

// ---------- audio capture ----------

// A hand-built WAV, because Safari cannot produce webm/opus: constructing a
// MediaRecorder with that mimeType throws inside the tap handler and presents
// as a dead microphone. PCM16 WAV is accepted by /v1/stt and is identical on
// every browser.
function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

function silentWav(seconds) {
  const rate = 16000;
  return encodeWav(new Float32Array(Math.round(rate * seconds)), rate);
}

const rec = { ctx: null, node: null, stream: null, chunks: [], rate: 16000, on: false, timer: null };

async function startRecording() {
  if (rec.on) return;
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    addBubble("bot", denied
      ? "I don't have microphone permission. Allow it in your browser settings, or just type."
      : "Couldn't open the microphone (" + (err && err.name) + "). Typing still works.");
    return;
  }

  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated but universally supported including iOS,
  // and the workload here is a memcpy. A blob-URL AudioWorklet would be blocked
  // by our own script-src 'self' CSP, so it would have to ship as a real file.
  const node = ctx.createScriptProcessor(4096, 1, 1);
  rec.chunks = [];
  rec.rate = ctx.sampleRate;
  node.onaudioprocess = (e) => {
    rec.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };
  source.connect(node);
  node.connect(ctx.destination);

  Object.assign(rec, { ctx, node, stream, on: true });
  el.mic.dataset.recording = "1";
  rec.timer = setTimeout(stopRecording, 30000);   // hard cap
}

function downsample(chunks, from, to) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const flat = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { flat.set(c, o); o += c.length; }
  if (from === to) return flat;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(flat.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), flat.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += flat[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

async function stopRecording() {
  if (!rec.on) return;
  clearTimeout(rec.timer);
  rec.on = false;
  el.mic.dataset.recording = "0";
  try { rec.node.disconnect(); } catch (_) {}
  try { rec.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
  try { await rec.ctx.close(); } catch (_) {}

  const samples = downsample(rec.chunks, rec.rate, 16000);
  rec.chunks = [];
  if (samples.length < 16000 * 0.3) return;      // too short to be speech

  el.mic.disabled = true;
  try {
    const fd = new FormData();
    fd.append("file", encodeWav(samples, 16000), "speech.wav");
    const res = await apiFetch("/v1/stt", { method: "POST", body: fd }, "speech-to-text");
    const data = await res.json();
    const text = (data && data.text) || "";
    // Land it in the box unsent, so a misheard word can be fixed before sending.
    el.input.value = el.input.value ? el.input.value + " " + text : text;
    autoGrow();
    el.input.focus();
  } catch (err) {
    addBubble("bot", "Transcription failed: " + err.message);
  } finally {
    el.mic.disabled = false;
  }
}

// ---------- composer plumbing ----------

function autoGrow() {
  el.input.style.height = "auto";
  el.input.style.height = Math.min(el.input.scrollHeight, window.innerHeight * 0.3) + "px";
}

// Keep the composer above the iOS keyboard, which otherwise covers it entirely.
if (window.visualViewport) {
  const vv = window.visualViewport;
  const sync = () => {
    const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    el.composer.style.transform = overlap ? `translateY(-${overlap}px)` : "";
  };
  vv.addEventListener("resize", sync);
  vv.addEventListener("scroll", sync);
}


// ---------- event log ----------
//
// A call is the one part of this app that is impossible to debug after the fact
// from the UI alone: the interesting events arrive over a socket and vanish.
// This keeps the last few hundred, survives a reload, and can be copied out.

const HW_LOG_KEY = "korean-teacher:hw-log:v1";
const LOG_MAX = 400;
let logBuf = [];
let logFlush = null;

function logEvent(kind, msg) {
  const stamp = new Date().toISOString().slice(11, 23);
  logBuf.push({ t: stamp, k: kind, m: String(msg).slice(0, 400) });
  if (logBuf.length > LOG_MAX) logBuf.splice(0, logBuf.length - LOG_MAX);
  if (el.logBody && !el.logPanel.hidden) renderLog();
  // Throttled, because a call emits events continuously and localStorage is sync.
  if (!logFlush) {
    logFlush = setTimeout(() => {
      logFlush = null;
      try { localStorage.setItem(HW_LOG_KEY, JSON.stringify(logBuf.slice(-LOG_MAX))); } catch (_) {}
    }, 2000);
  }
}

function loadLog() {
  try {
    const raw = localStorage.getItem(HW_LOG_KEY);
    if (raw) logBuf = JSON.parse(raw) || [];
  } catch (_) { logBuf = []; }
}

// Copy the log for one call only. 400 mixed lines is worse than 40 relevant ones.
async function copyLogSlice(from, btn) {
  const slice = logBuf.slice(from);
  const text = [
    "한국어 숙제 — call log",
    "when: " + new Date().toISOString(),
    "agent: " + navigator.userAgent,
    "model: " + (cfg.model || DEFAULT_MODEL) + " | voice: " + (cfg.voice || "ara"),
    "sentences: " + state.sentences.length,
    "-".repeat(60),
  ].join("\n") + "\n" + slice.map((e) => `${e.t} [${e.k}] ${e.m}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    if (btn) { btn.textContent = "Copied " + slice.length + " lines ✓"; btn.disabled = true; }
  } catch (_) {
    // Standalone PWAs sometimes block the clipboard API outright.
    if (btn) { btn.textContent = "Opening log…"; btn.disabled = true; }
    el.logPanel.hidden = false;
    renderLog();
    el.logPanel.scrollIntoView({ block: "start" });
    el.logStatus.textContent = "Clipboard blocked — select the text above and copy.";
  }
}

function logText() {
  const head = [
    "한국어 숙제 — event log",
    "when: " + new Date().toISOString(),
    "agent: " + navigator.userAgent,
    "model: " + (cfg.model || DEFAULT_MODEL) + " | voice: " + (cfg.voice || "ara"),
    "sentences: " + state.sentences.length,
    "-".repeat(60),
  ].join("\n");
  return head + "\n" + logBuf.map((e) => `${e.t} [${e.k}] ${e.m}`).join("\n");
}

function renderLog() {
  el.logBody.textContent = logBuf.map((e) => `${e.t} [${e.k}] ${e.m}`).join("\n");
  el.logBody.scrollTop = el.logBody.scrollHeight;
}

// ---------- live call (xAI realtime speech-to-speech) ----------
//
// The browser opens wss://api.x.ai/v1/realtime directly. WebSocket handshakes are
// exempt from CORS, so this reaches xAI from a static page where plain fetch to
// /v1/chat/completions may not.
//
// Auth: xAI documents a server-minted ephemeral token in the subprotocol. We have
// no server, so we try the raw key in both known subprotocol shapes. If xAI
// refuses both, the call cannot work without a server and we say so plainly.

const REALTIME_URL = "wss://api.x.ai/v1/realtime?model=grok-voice-latest";
const CALL_PROTOS = [
  (k) => ["xai-client-secret." + k],
  (k) => ["realtime", "openai-insecure-api-key." + k, "openai-beta.realtime-v1"],
];

const CALL_TOOLS = [{
  type: "function",
  name: "save_sentence",
  description:
    "Save one Korean sentence that Julien has agreed to put in his homework. Call this " +
    "the moment he accepts a sentence — do not wait until the end, and never read the " +
    "arguments out loud.",
  parameters: {
    type: "object",
    properties: {
      day: { type: "string", description: "The Korean weekday (월요일 …) or 소개 for a self-introduction sentence." },
      ko: { type: "string", description: "The Korean sentence exactly as he will send it." },
      rr: { type: "string", description: "Revised Romanisation of the pronunciation." },
      en: { type: "string", description: "Plain English gloss." },
    },
    required: ["day", "ko", "en"],
  },
}];

const call = {
  ws: null, ctx: null, stream: null, micNode: null, srcNode: null,
  active: false, ready: false, configSent: false, muted: false,
  playQueue: [], playhead: 0, gen: 0, logStart: 0,
  userBubble: null, botBubble: null,
  // The realtime API announces one finished tool call TWICE — once as
  // response.function_call_arguments.done and again inside
  // response.output_item.done. Without this set, every sentence is saved twice.
  handledCalls: new Set(),
};

function callSend(o) {
  if (call.ws && call.ws.readyState === 1) call.ws.send(JSON.stringify(o));
}

function setCallStatus(text, orbClass) {
  el.callStatus.textContent = text;
  if (orbClass !== undefined) el.orb.className = "hw-orb " + orbClass;
}

// --- audio out ---
function playDelta(b64) {
  const ctx = call.ctx;
  if (!ctx) return;
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(buf);
  if (!i16.length) return;
  const f32 = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
  const ab = ctx.createBuffer(1, f32.length, ctx.sampleRate);
  ab.copyToChannel(f32, 0);
  const src = ctx.createBufferSource();
  src.buffer = ab;
  src.connect(ctx.destination);
  const t = Math.max(ctx.currentTime, call.playhead);
  src.start(t);
  call.playhead = t + ab.duration;
  call.playQueue.push(src);
  src.onended = () => {
    const i = call.playQueue.indexOf(src);
    if (i >= 0) call.playQueue.splice(i, 1);
    if (!call.playQueue.length && call.active) {
      setCallStatus(call.muted ? "Muted" : "Listening…", call.muted ? "muted" : "listening");
    }
  };
  if (!call.muted) setCallStatus("선생님 is speaking…", "speaking");
}

function stopPlayback() {
  call.playQueue.forEach((s) => { try { s.stop(); } catch (_) {} });
  call.playQueue = [];
  call.playhead = 0;
}

// --- audio in ---
function f32ToB64(f32) {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const v = Math.max(-1, Math.min(1, f32[i]));
    i16[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const bytes = new Uint8Array(i16.buffer);
  let bin = "";
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  }
  return btoa(bin);
}

function wireCallMic() {
  const ctx = call.ctx;
  call.srcNode = ctx.createMediaStreamSource(call.stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  let chunks = [], len = 0;
  const target = Math.round(ctx.sampleRate * 0.1);   // ~100 ms per frame
  proc.onaudioprocess = (e) => {
    if (!call.active || !call.ready || call.muted) return;
    const d = e.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(d));
    len += d.length;
    if (len >= target) {
      const all = new Float32Array(len);
      let o = 0;
      for (const c of chunks) { all.set(c, o); o += c.length; }
      chunks = []; len = 0;
      callSend({ type: "input_audio_buffer.append", audio: f32ToB64(all) });
    }
  };
  call.srcNode.connect(proc);
  proc.connect(ctx.destination);
  call.micNode = proc;
}

// --- live transcript into the normal chat ---
function liveUser(text) {
  if (!call.userBubble) call.userBubble = addBubble("user", "");
  call.userBubble.textContent = text;
  scrollDown();
}

function liveBot(delta) {
  if (!call.botBubble) call.botBubble = addBubble("bot", "");
  call.botBubble.textContent += delta;
  scrollDown();
}

function sessionUpdate() {
  return {
    type: "session.update",
    session: {
      voice: cfg.voice || "ara",
      instructions: systemPrompt() +
        "\n\n## YOU ARE ON A VOICE CALL\n" +
        "He can hear you, so speak like a person: short turns, no markdown, no bullet " +
        "points, no reading out punctuation. Never say the words 'day', 'ko', 'rr' or " +
        "'en' as field names, and never spell out a block format — on a call you save a " +
        "sentence by CALLING THE save_sentence TOOL, silently, and then just carry on " +
        "talking. Say the Korean sentence out loud clearly and slowly once, then ask if " +
        "he is happy with it.",
      audio: {
        input: { format: { type: "audio/pcm", rate: call.ctx.sampleRate }, transcription: {} },
        output: { format: { type: "audio/pcm", rate: call.ctx.sampleRate } },
      },
      turn_detection: { type: "server_vad", threshold: 0.8, silence_duration_ms: 600, prefix_padding_ms: 300 },
      tools: CALL_TOOLS,
    },
  };
}

function onCallTool(name, callId, argsStr) {
  if (!callId || call.handledCalls.has(callId)) {
    logEvent("tool", "duplicate ignored: " + name + " " + callId);
    return;
  }
  call.handledCalls.add(callId);
  logEvent("tool", name + " " + String(argsStr).slice(0, 160));

  let out = { ok: false };
  if (name === "save_sentence") {
    try {
      const a = JSON.parse(argsStr || "{}");
      if (a.ko) {
        const added = acceptSentence({ day: a.day || "", ko: a.ko, rr: a.rr || "", en: a.en || "" }, { fromCall: true });
        out = added
          ? { ok: true, saved: a.ko }
          : { ok: false, reason: "already saved — do not save this sentence again" };
        out.total = state.sentences.length;
        out.remaining = Math.max(0, task.target - state.sentences.length);
      }
    } catch (_) { out = { ok: false, error: "bad arguments" }; }
  }
  logEvent("tool", "-> " + JSON.stringify(out));
  callSend({ type: "conversation.item.create", item: { type: "function_call_output", call_id: callId, output: JSON.stringify(out) } });
  callSend({ type: "response.create" });
}

function handleCallEvent(msg) {
  switch (msg.type) {
    case "conversation.created":
    case "session.created":
      if (call.configSent) break;
      call.configSent = true;
      callSend(sessionUpdate());
      break;
    case "session.updated":
      if (!call.ready) {
        call.ready = true;
        setCallStatus("Listening…", "listening");
        callSend({ type: "response.create" });
      }
      break;
    case "error":
      logEvent("err", JSON.stringify(msg.error || msg).slice(0, 300));
      addBubble("bot", "Call error: " + JSON.stringify(msg.error || msg).slice(0, 200)).classList.add("err");
      break;
    case "input_audio_buffer.speech_started":
      stopPlayback();
      call.userBubble = null;
      if (call.active) setCallStatus("Listening…", "listening");
      break;
    case "conversation.item.input_audio_transcription.updated":
      liveUser(msg.transcript || msg.delta || msg.text || "");
      break;
    case "conversation.item.input_audio_transcription.completed":
      if (msg.transcript || msg.text) liveUser(msg.transcript || msg.text);
      call.userBubble = null;
      break;
    case "response.created":
      call.botBubble = null;
      break;
    case "response.output_audio.delta":
      if (msg.delta) playDelta(msg.delta);
      break;
    case "response.output_audio_transcript.delta":
      if (msg.delta) liveBot(msg.delta);
      break;
    case "response.function_call_arguments.done":
      onCallTool(msg.name, msg.call_id, msg.arguments);
      break;
    case "response.output_item.done":
      if (msg.item && msg.item.type === "function_call") {
        onCallTool(msg.item.name, msg.item.call_id, msg.item.arguments);
      }
      break;
  }
}

function connectCall(which) {
  const protos = CALL_PROTOS[which](cfg.key);
  let opened = false;
  let ws;
  try {
    ws = new WebSocket(REALTIME_URL, protos);
  } catch (err) {
    endCall("Couldn't open the call: " + err.message);
    return;
  }
  call.ws = ws;
  ws.onopen = () => {
    opened = true;
    logEvent("call", "socket open via subprotocol form " + (which + 1));
    setCallStatus("Connected, setting up…", "connecting");
  };
  ws.onmessage = (e) => {
    let m;
    try { m = JSON.parse(e.data); } catch (_) { return; }   // non-JSON frame
    // Audio deltas arrive continuously; logging each would drown everything else.
    if (m.type && m.type !== "response.output_audio.delta") logEvent("ws", m.type);
    handleCallEvent(m);
  };
  ws.onclose = (e) => {
    logEvent("call", "socket closed code=" + e.code + " opened=" + opened + " form=" + (which + 1));
    if (call.ws !== ws) return;                 // superseded by a newer attempt
    if (!opened && which + 1 < CALL_PROTOS.length) {
      setCallStatus("Retrying…", "connecting");
      connectCall(which + 1);
      return;
    }
    if (!opened) {
      endCall(
        "xAI refused the call. Its realtime API normally wants a short-lived token " +
        "minted by a server, and a raw key was rejected — so voice calling needs a " +
        "server that this app deliberately doesn't have. Typing still works. " +
        "(Also check voice is enabled for your team on console.x.ai.)"
      );
      return;
    }
    if (call.active) endCall("Call ended" + (e.code ? " (" + e.code + ")" : "") + ".");
  };
}

async function startCall() {
  if (call.active) return;
  if (!cfg.key) { showSetup(true); return; }
  call.logStart = logBuf.length;
  logEvent("call", "starting");
  call.gen++;
  const gen = call.gen;

  el.callbar.hidden = false;
  el.call.disabled = true;
  setCallStatus("Connecting…", "connecting");

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    call.ctx = new Ctx();
    await call.ctx.resume();
    call.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (gen !== call.gen) throw { aborted: true };
  } catch (err) {
    if (err && err.aborted) return;
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    endCall(denied
      ? "I need microphone permission to call. Allow it in your browser settings, or just type."
      : "Couldn't open the microphone (" + (err && err.name) + "). Typing still works.");
    return;
  }

  call.active = true;
  call.ready = false;
  call.configSent = false;
  call.muted = false;
  call.handledCalls.clear();
  el.mute.textContent = "Mute";
  wireCallMic();
  connectCall(0);
}

function endCall(message) {
  logEvent("call", "ending" + (message ? ": " + message.slice(0, 120) : ""));
  call.gen++;
  const wasActive = call.active;
  call.active = false;
  call.ready = false;
  call.configSent = false;
  stopPlayback();
  const ws = call.ws;
  call.ws = null;
  if (ws) { try { ws.close(); } catch (_) {} }
  if (call.micNode) { try { call.micNode.disconnect(); } catch (_) {} call.micNode = null; }
  if (call.srcNode) { try { call.srcNode.disconnect(); } catch (_) {} call.srcNode = null; }
  if (call.stream) { call.stream.getTracks().forEach((t) => t.stop()); call.stream = null; }
  if (call.ctx) { call.ctx.close().catch(() => {}); call.ctx = null; }
  call.userBubble = null;
  call.botBubble = null;
  call.handledCalls.clear();
  el.callbar.hidden = true;
  el.call.disabled = false;
  const from = call.logStart;
  if (message) {
    addBubbleWithAction("bot err", message, "📋 Copy call log", (btn) => copyLogSlice(from, btn));
  } else if (wasActive) {
    addBubbleWithAction("bot", "Call ended.", "📋 Copy call log", (btn) => copyLogSlice(from, btn));
  }
}

// A call holds the microphone open; dropping the tab must not leave it live.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && call.active) endCall("Call ended — you left the app.");
});

// ---------- events ----------

el.reload.addEventListener("click", () => location.reload());

el.logBtn.addEventListener("click", () => {
  el.logPanel.hidden = !el.logPanel.hidden;
  if (!el.logPanel.hidden) { renderLog(); el.logPanel.scrollIntoView({ block: "start" }); }
});
el.logClose.addEventListener("click", () => { el.logPanel.hidden = true; });
el.logClear.addEventListener("click", () => {
  logBuf = [];
  try { localStorage.removeItem(HW_LOG_KEY); } catch (_) {}
  renderLog();
  el.logStatus.textContent = "Cleared.";
});
el.logCopy.addEventListener("click", async () => {
  const text = logText();
  try {
    await navigator.clipboard.writeText(text);
    el.logStatus.textContent = "Copied " + logBuf.length + " events.";
    el.logStatus.className = "hw-probe ok";
  } catch (_) {
    // Clipboard is blocked in some standalone PWA contexts; make it selectable.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.width = "100%";
    ta.rows = 10;
    el.logPanel.appendChild(ta);
    ta.select();
    el.logStatus.textContent = "Select the text above and copy manually.";
    el.logStatus.className = "hw-probe";
  }
});
el.conn.addEventListener("click", () => { fillSetup(); showSetup(true); });

el.save.addEventListener("click", async () => {
  el.save.disabled = true;
  const ok = await probeTransport();
  el.save.disabled = false;
  if (ok) { showSetup(false); boot(); }
});

el.clear.addEventListener("click", () => {
  localStorage.removeItem(HW_CFG_KEY);
  Object.assign(cfg, {
    key: "", model: DEFAULT_MODEL, base: DEFAULT_BASE, remember: true, sttOk: false,
  });
  fillSetup();
  probeMsg("Key cleared from this browser.", "ok");
});

el.send.addEventListener("click", () => {
  const text = el.input.value.trim();
  if (!text) return;
  el.input.value = "";
  autoGrow();
  send(text);
});

el.input.addEventListener("input", autoGrow);
el.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); el.send.click(); }
});

el.mic.addEventListener("click", () => { rec.on ? stopRecording() : startRecording(); });

el.call.addEventListener("click", () => startCall());
el.hangup.addEventListener("click", () => endCall());
el.mute.addEventListener("click", () => {
  if (!call.active) return;
  call.muted = !call.muted;
  el.mute.textContent = call.muted ? "Unmute" : "Mute";
  setCallStatus(call.muted ? "Muted" : "Listening…", call.muted ? "muted" : "listening");
});

el.personaReset.addEventListener("click", () => {
  el.persona.value = DEFAULT_PERSONA;
  cfg.persona = "";
  probeMsg("Teacher reset to the default.", "ok");
});

el.finish.addEventListener("click", () => {
  if (!state.sentences.length) return;
  showFinal();
});

for (const box of [el.envelope, el.english]) {
  box.addEventListener("change", () => { el.message.value = buildMessage(); });
}

el.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el.message.value);
    el.finalStatus.textContent = "Copied.";
    el.finalStatus.className = "hw-probe ok";
  } catch (_) {
    el.message.select();
    el.finalStatus.textContent = "Press ⌘C / Ctrl-C to copy.";
    el.finalStatus.className = "hw-probe";
  }
});

el.share.addEventListener("click", async () => {
  if (!navigator.share) { el.copy.click(); return; }
  try { await navigator.share({ text: el.message.value }); } catch (_) { /* user cancelled */ }
});

el.playAll.addEventListener("click", () => {
  speakSequence(state.sentences.map((r) => r.ko));
});

el.restart.addEventListener("click", () => {
  clearDraft();
  startConversation();
});

// ---------- boot ----------

function boot() {
  state.known = buildKnownSet();
  el.promptKo.textContent = task.teacher.ko;
  el.promptEn.textContent = task.brief;
  el.mic.hidden = !cfg.sttOk;
  el.composer.hidden = false;

  const resumed = loadDraft();
  renderProgress();

  if (resumed) {
    for (const r of state.sentences) renderDayCard(r, { accepted: true });
    const p = progress();
    addBubble("bot", p.done
      ? "Everything's here. Hit Finish to assemble the message."
      : "Picking up where we left off. Keep going — what else did you do?");
    if (p.done) showFinal();
  } else {
    startConversation();
  }
}

loadCfg();
loadLog();
logEvent("app", "loaded " + location.pathname);
if (isConfigured()) {
  showSetup(false);
  boot();
} else {
  fillSetup();
  showSetup(true);
}
