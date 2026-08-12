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
  setup: $("hw-setup"),
  tabRelay: $("tab-relay"),
  tabDirect: $("tab-direct"),
  paneRelay: $("pane-relay"),
  paneDirect: $("pane-direct"),
  relayUrl: $("hw-relay-url"),
  relayToken: $("hw-relay-token"),
  key: $("hw-key"),
  model: $("hw-model"),
  base: $("hw-base"),
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
  mode: "relay",          // "relay" | "direct"
  relayUrl: "",
  relayToken: "",
  key: "",
  model: DEFAULT_MODEL,
  base: DEFAULT_BASE,
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
    for (const k of ["mode", "relayUrl", "relayToken", "key", "model", "base"]) {
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
  return cfg.mode === "relay"
    ? Boolean(cfg.relayUrl && cfg.relayToken)
    : Boolean(cfg.key);
}

// ---------- transport ----------

// Returns { url, headers } for a given API path, in whichever mode is active.
function endpoint(path, extraHeaders) {
  const headers = Object.assign({}, extraHeaders || {});
  let url;
  if (cfg.mode === "relay") {
    url = cfg.relayUrl.replace(/\/+$/, "") + path;
    headers["x-relay-token"] = cfg.relayToken;
  } else {
    url = (cfg.base || DEFAULT_BASE).replace(/\/+$/, "") + path;
    headers["Authorization"] = "Bearer " + cfg.key;
  }
  return { url, headers };
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
    throw new Error(
      `Couldn't reach the ${label || "API"}. This is usually one of: the browser blocked the ` +
      `request (CORS), the URL is wrong, or the network dropped. ` +
      (cfg.mode === "direct"
        ? "Chat is normally blocked in browser-key mode — try the relay."
        : "Check the relay URL, and that `wrangler deploy` succeeded.")
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const text = await res.clone().text();
      detail = text.slice(0, 400);
    } catch (_) { /* body already consumed or empty */ }
    if (res.status === 401) {
      throw new Error(
        cfg.mode === "relay"
          ? "Relay rejected the token (401). Check RELAY_TOKEN matches what you set with wrangler."
          : "xAI rejected the key (401). Check the key is current and has credit."
      );
    }
    if (res.status === 429) throw new Error("Rate limited (429). Wait a moment and try again.");
    if (res.status === 404 && cfg.mode === "relay") {
      throw new Error("Relay returned 404. Is the Relay URL right, and does the Worker allow this path?");
    }
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
  return `You are a patient Korean tutor helping ONE specific beginner, Julien, write his weekly
homework text message for his Korean teacher. You know exactly what he has studied,
because his flashcard decks are listed below.

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

function acceptSentence(day) {
  state.sentences.push({
    day: day.day || "",
    ko: day.ko,
    rr: day.rr || "",
    en: day.en || "",
  });
  renderProgress();
  saveDraft();

  const p = progress();
  renderBlankCheck(day.ko, () => {
    if (p.done) {
      addBubble("bot", "That's all eight. Hit Finish when you're ready and I'll put the message together.");
      showFinal();
      return;
    }
    // No scripted next-step: the tutor decides what to ask for, from the
    // control line. The app only nudges the conversation along.
    send("Added. What next?", { silent: true });
  });
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
  el.final.hidden = false;
  el.finalCount.textContent = `${state.sentences.length} / ${task.target}`;
  el.message.value = buildMessage();
  el.final.scrollIntoView({ behavior: "smooth", block: "start" });
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
  el.transcript.textContent = "";
  el.final.hidden = true;
  renderProgress();
}

// ---------- setup panel ----------

function showSetup(show) {
  el.setup.hidden = !show;
  el.task.hidden = show;
  el.conn.hidden = show;
  if (!show) {
    const where = cfg.mode === "relay"
      ? new URL(cfg.relayUrl).host
      : new URL(cfg.base || DEFAULT_BASE).host;
    el.conn.textContent = "→ " + where;
    el.conn.hidden = false;
  }
}

function setMode(mode) {
  cfg.mode = mode;
  const relay = mode === "relay";
  el.tabRelay.setAttribute("aria-selected", String(relay));
  el.tabDirect.setAttribute("aria-selected", String(!relay));
  el.paneRelay.hidden = !relay;
  el.paneDirect.hidden = relay;
}

function fillSetup() {
  setMode(cfg.mode);
  el.relayUrl.value = cfg.relayUrl;
  el.relayToken.value = cfg.relayToken;
  el.key.value = cfg.key;
  el.model.value = cfg.model || DEFAULT_MODEL;
  el.base.value = cfg.base || DEFAULT_BASE;
  el.remember.checked = cfg.remember;
}

function readSetup() {
  cfg.relayUrl = el.relayUrl.value.trim();
  cfg.relayToken = el.relayToken.value.trim();
  cfg.key = el.key.value.trim();
  cfg.model = el.model.value.trim() || DEFAULT_MODEL;
  cfg.base = el.base.value.trim() || DEFAULT_BASE;
  cfg.remember = el.remember.checked;
}

function probeMsg(text, cls) {
  el.probe.textContent = text;
  el.probe.className = "hw-probe" + (cls ? " " + cls : "");
}

async function probeTransport() {
  readSetup();

  if (cfg.mode === "relay") {
    if (!/^https:\/\//i.test(cfg.relayUrl)) { probeMsg("Relay URL must start with https://", "err"); return false; }
    if (!cfg.relayToken) { probeMsg("Relay token is required.", "err"); return false; }
  } else {
    if (!cfg.key) { probeMsg("Paste a key, or switch to the relay tab.", "err"); return false; }
    if (!/^https:\/\//i.test(cfg.base)) { probeMsg("API base must start with https://", "err"); return false; }
  }

  probeMsg("Testing chat…");
  try {
    await chat(
      [{ role: "user", content: "Reply with the single word: ok" }],
      null
    );
  } catch (err) {
    probeMsg("Chat failed. " + err.message, "err");
    return false;
  }

  probeMsg("Chat works. Testing speech-to-text…");
  try {
    const wav = silentWav(0.2);
    const fd = new FormData();
    fd.append("file", wav, "probe.wav");
    await apiFetch("/v1/stt", { method: "POST", body: fd }, "speech-to-text");
    cfg.sttOk = true;
    probeMsg("Chat and microphone both working.", "ok");
  } catch (err) {
    cfg.sttOk = false;
    probeMsg("Chat works. Microphone unavailable (" + err.message + ") — typing still works.", "ok");
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

// ---------- events ----------

el.tabRelay.addEventListener("click", () => setMode("relay"));
el.tabDirect.addEventListener("click", () => setMode("direct"));
el.reload.addEventListener("click", () => location.reload());
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
    mode: "relay", relayUrl: "", relayToken: "", key: "",
    model: DEFAULT_MODEL, base: DEFAULT_BASE, remember: true, sttOk: false,
  });
  fillSetup();
  probeMsg("Cleared.", "ok");
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
if (isConfigured()) {
  showSetup(false);
  boot();
} else {
  fillSetup();
  showSetup(true);
}
