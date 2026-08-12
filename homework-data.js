// Korean Teacher — homework helper data.
//
// Pure data plus small pure functions. No DOM, no side effects, no network.
// Loaded after data.js, so DECKS is available to buildLexicon().

const HW = {
  // Dictionary form, past polite, English. These are the verbs the tutor may
  // treat as known for the weekly diary task.
  verbs: [
    ["하다", "했어요", "do"],
    ["가다", "갔어요", "go"],
    ["오다", "왔어요", "come"],
    ["먹다", "먹었어요", "eat"],
    ["마시다", "마셨어요", "drink"],
    ["보다", "봤어요", "watch"],
    ["만나다", "만났어요", "meet"],
    ["공부하다", "공부했어요", "study"],
    ["일하다", "일했어요", "work"],
    ["자다", "잤어요", "sleep"],
    ["일어나다", "일어났어요", "get up"],
    ["쉬다", "쉬었어요", "rest"],
    ["사다", "샀어요", "buy"],
    ["읽다", "읽었어요", "read"],
    ["쓰다", "썼어요", "write"],
    ["듣다", "들었어요", "listen"],
    ["걷다", "걸었어요", "walk"],
    ["놀다", "놀았어요", "hang out"],
    ["배우다", "배웠어요", "learn"],
    ["요리하다", "요리했어요", "cook"],
    ["청소하다", "청소했어요", "clean"],
    ["운동하다", "운동했어요", "exercise"],
    ["전화하다", "전화했어요", "phone"],
    ["여행하다", "여행했어요", "travel"],
    ["타다", "탔어요", "ride"],
  ],

  stretchVerbs: [
    ["만들다", "만들었어요", "make"],
    ["씻다", "씻었어요", "wash"],
    ["입다", "입었어요", "wear"],
    ["찍다", "찍었어요", "take (photo)"],
    ["말하다", "말했어요", "speak"],
  ],

  // Descriptives all take 이/가, never 을/를.
  descriptives: [
    ["좋았어요", "was good"],
    ["맛있었어요", "was tasty"],
    ["재미있었어요", "was fun"],
    ["피곤했어요", "was tired"],
    ["바빴어요", "was busy"],
    ["있었어요", "there was"],
    ["추웠어요", "was cold"],
    ["더웠어요", "was hot"],
  ],

  connectives: ["그리고", "그래서", "하고", "도", "많이", "이번", "지난", "다음", "오전", "오후", "안"],

  // Verified against data.js: 요리, 여행, 전화 DO have cards. 공부, 청소, 운동,
  // 주말, 음악 have none — 일 appears only as the sino numeral "1". These are
  // licensed for this task but must never be described to the student as words
  // he already knows.
  extraNouns: ["공부", "일", "청소", "운동", "주말", "음악"],

  particles: [
    "에서", "한테", "께서", "하고", "이랑", "까지", "부터", "마다", "처럼",
    "은", "는", "이", "가", "을", "를", "에", "도", "의", "만", "랑", "과", "와",
  ],

  // Cards that exist in the decks but have no place in homework for a teacher.
  denylist: ["쉬", "똥", "오줌"],

  lexiconDecks: [
    "lessonIntroductions", "lessonBody", "lessonFamily", "lessonDays",
    "lessonCountries", "lessonFood", "lessonNature", "lessonObjects", "words",
  ],

  groupLabels: {
    lessonIntroductions: "people, places, nationality",
    lessonBody: "body",
    lessonFamily: "family",
    lessonDays: "days",
    lessonCountries: "countries",
    lessonFood: "food and drink",
    lessonNature: "nature",
    lessonObjects: "everyday objects",
    words: "general vocabulary",
  },

  // Distractors for the tap-to-check step. Deterministic and offline.
  distractors: {
    "에": ["에서", "은"],
    "에서": ["에", "는"],
    "을": ["를", "은"],
    "를": ["을", "는"],
    "이": ["가", "은"],
    "가": ["이", "는"],
    "도": ["를", "을"],
  },

  whyLines: {
    "particle-place": "에 is where you went; 에서 is where you did something.",
    "particle-object": "Same 받침 rule as 은/는 — 을 after a 받침, 를 after a vowel.",
    "particle-subject": "좋다 · 맛있다 · 재미있다 take 이/가, never 을/를.",
    "particle-time": "Days and times take 에 — but 오늘, 어제, 내일 never do.",
    "tense": "Stem + 았어요 if the last vowel is ㅏ or ㅗ, otherwise 었어요. 하다 → 했어요.",
    "negation": "안 goes before the verb, and noun+하다 verbs split: 공부 안 했어요.",
    "wordorder": "[Time] [Place] [Object] [Verb] — the verb always lands last.",
    "connective": "그리고 starts a new sentence; -고 joins verbs inside one.",
  },
};

const TASKS = {
  thisWeek: {
    label: "This week — introduce myself + my week",
    teacher: { ko: "이번 주에 무엇을 하셨나요?", en: "What did you do this week?" },
    // No slots and no day picker. The student just talks; sentences accumulate
    // until the target is reached. The tutor works out which day a sentence
    // belongs to from what they say.
    brief:
      "Two parts. First a short self-introduction (2-3 sentences). Then five " +
      "sentences about the week, one per day.",
    target: 8,
    parts: [
      { id: "intro", label: "Introducing myself", target: 3 },
      { id: "week", label: "My week", target: 5 },
    ],
    shape: "[Day]에 [Place]에서 [Object]을/를 [Verb-past].",
    greeting: ["안녕하세요, 선생님."],
    signoff: ["감사합니다!"],
    levelUpLadder: [
      "에서 contrasted with 에", "그리고", "time-of-day",
      "이/가 + a 좋았어요 / 맛있었어요 comment", "-고", "그래서", "도",
    ],
  },
};

// The teacher's character. Editable in the setup panel — this is the default.
// It shapes tone and delivery only; the grammar rules live in the system prompt
// and always win over anything written here.
const DEFAULT_PERSONA = `You are 선생님 — Julien's Korean teacher.

Warm, direct, and genuinely pleased when he gets something right. You have taught
beginners for years, so nothing he gets wrong surprises you and you never make him
feel slow.

How you talk:
- Mostly English, because he is a beginner and the point is to get the homework
  written. Drop in the Korean he already knows — 네, 좋아요, 맞아요, 아니요, 잘했어요 —
  the way a bilingual teacher naturally would.
- Short sentences. You are speaking out loud, not writing an essay.
- You ask one thing at a time and then actually wait.
- Dry humour occasionally. Never sarcastic about his Korean.
- When he gets something right you say so specifically — "그 particle 맞아요, 을 after
  a 받침" — not just "good job".
- When he is wrong you fix it in one line without ceremony and move straight on.
  No long grammar lectures, ever.
- You call him 줄리엔 씨 sometimes, especially when pleased with him.`;

// Weekday names for the tutor's reference only — there is deliberately no
// day-picker UI any more.
const WEEKDAYS = [
  ["월요일", "Monday"], ["화요일", "Tuesday"], ["수요일", "Wednesday"],
  ["목요일", "Thursday"], ["금요일", "Friday"], ["토요일", "Saturday"],
  ["일요일", "Sunday"],
];

// What this student actually gets wrong, taken from real submitted homework
// rather than assumed. Drives what the tutor targets.
const OBSERVED_ERRORS = [
  "Object particle 을/를 dropped about half the time: 커피 마셨어요, 파스타 먹었어요 (→ 커피를, 파스타를).",
  "에서 not yet known — uses a bare noun for a location: 식당 파스타 먹었어요 (→ 식당에서).",
  "Time 에 inconsistent — present on 일요일에/월요일에/목요일에, dropped on 화요일/금요일.",
  "Noun-noun compound order reversed: 미팅 고객 (→ 고객 미팅).",
  "씨 written as 시: 로지 시 (→ 로지 씨).",
  "랑 attached to the day instead of the person: 화요일 랑 로지 (→ 로지 씨랑).",
  "저는 repeated at the head of every sentence — fine, but it can be dropped after the first.",
];

// ---------- lexicon ----------

// Every word the student has a card for, grouped and labelled for the prompt.
function buildLexicon() {
  const groups = [];
  // NB: `DECKS` is a top-level `const` in data.js, so it is script-scoped and is
  // NOT a property of `window`. Reference it directly and feature-test with
  // typeof — `window.DECKS` would always be undefined and silently yield an
  // empty lexicon, leaving the tutor with no idea what the student knows.
  if (typeof DECKS === "undefined") return "";
  for (const id of HW.lexiconDecks) {
    if (!DECKS[id]) continue;
    const words = DECKS[id].build()
      .map((c) => (c.front || "").replace(/[.?!,~]/g, "").trim())
      // One internal space is allowed on purpose: a Hangul-only test would drop
      // 이번 주 / 지난 주, forcing the tutor to declare "this week" a new word in
      // answer to a question that literally contains it.
      .filter((w) => w && /^[가-힣]+( [가-힣]+)?$/.test(w) && !HW.denylist.includes(w));
    if (words.length) {
      groups.push(`${HW.groupLabels[id] || id}: ${[...new Set(words)].join(" ")}`);
    }
  }
  return groups.join("\n");
}

// The full set of forms we consider "known", for the unknown-word heuristic.
function buildKnownSet() {
  const known = new Set();
  const add = (w) => { if (w) known.add(w); };

  if (typeof DECKS === "undefined") return known;
  for (const id of HW.lexiconDecks) {
    if (!DECKS[id]) continue;
    for (const c of DECKS[id].build()) {
      const w = (c.front || "").replace(/[.?!,~]/g, "").trim();
      if (!w || HW.denylist.includes(w)) continue;
      if (/^[가-힣]+( [가-힣]+)?$/.test(w)) {
        add(w);
        for (const part of w.split(" ")) add(part);
      }
    }
  }
  for (const [dict, past] of [...HW.verbs, ...HW.stretchVerbs]) {
    add(dict);
    add(past);
    // 공부하다 -> 공부, so the bare action noun counts as known too.
    if (dict.endsWith("하다")) add(dict.slice(0, -2));
    if (past.endsWith("했어요")) add(past.slice(0, -3));
  }
  for (const [form] of HW.descriptives) add(form);
  for (const w of HW.connectives) add(w);
  for (const w of HW.extraNouns) add(w);
  return known;
}

// Strip one trailing particle, and the -고 connective ending.
function stripParticle(word) {
  const candidates = [word];
  for (const p of HW.particles) {
    if (word.length > p.length && word.endsWith(p)) candidates.push(word.slice(0, -p.length));
  }
  if (word.length > 1 && word.endsWith("고")) candidates.push(word.slice(0, -1));
  return candidates;
}

// Heuristic (~96%). It only ever badges a word for review; it never blocks a
// sentence, because a false positive on correct Korean would be worse than a miss.
function unknownWords(sentence, known) {
  const set = known || buildKnownSet();
  const out = [];
  for (const raw of String(sentence).split(/\s+/)) {
    const word = raw.replace(/[.?!,~"'()]/g, "").trim();
    if (!word || !/[가-힣]/.test(word)) continue;
    if (stripParticle(word).some((c) => set.has(c))) continue;
    out.push(word);
  }
  return [...new Set(out)];
}

// ---------- model output parsing ----------

const DAY_RE = /<<<DAY\s*([\s\S]*?)>>>/;

// Returns { prose, day }. If the model forgets the block the prose still renders,
// just without a "Use this" button.
function parseDay(text) {
  const m = String(text).match(DAY_RE);
  if (!m) return { prose: String(text), day: null };
  const f = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*(day|ko|rr|en|new|tag)\s*:\s*(.+?)\s*$/i);
    if (kv) f[kv[1].toLowerCase()] = kv[2];
  }
  if (!f.ko) return { prose: String(text), day: null };
  const list = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
  f.newWords = list(f.new);
  f.tags = list(f.tag);
  return { prose: String(text).replace(DAY_RE, "").trim(), day: f };
}

// Exposed for tests in Node; harmless in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { HW, TASKS, buildLexicon, buildKnownSet, unknownWords, parseDay, stripParticle };
}
