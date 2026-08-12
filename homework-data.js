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
  weekDiary: {
    label: "Weekly diary — what I did",
    teacher: { ko: "이번 주에 무엇을 하셨나요?", en: "What did you do this week?" },
    deliverable: "5 sentences, one per day, sent to the teacher as a text message.",
    // All seven offered; the student picks any five.
    slots: [
      { id: "mon", label: "Monday", ko: "월요일", dow: 1 },
      { id: "tue", label: "Tuesday", ko: "화요일", dow: 2 },
      { id: "wed", label: "Wednesday", ko: "수요일", dow: 3 },
      { id: "thu", label: "Thursday", ko: "목요일", dow: 4 },
      { id: "fri", label: "Friday", ko: "금요일", dow: 5 },
      { id: "sat", label: "Saturday", ko: "토요일", dow: 6 },
      { id: "sun", label: "Sunday", ko: "일요일", dow: 0 },
    ],
    pick: 5,
    dateAware: true,
    shape: "[Day]에 [Place]에서 [Object]을/를 [Verb-past].",
    greeting: ["안녕하세요, 선생님.", "저는 줄리엔이에요."],
    signoff: ["감사합니다!"],
    levelUpLadder: [
      "time-of-day", "그리고", "에서 contrasted with 에",
      "이/가 + a 좋았어요 / 맛있었어요 comment", "-고", "그래서", "도",
    ],
    examples: [
      { plain: "월요일에 학교에 갔어요.", rich: "월요일 아침에 학교에 갔어요. 그리고 한국어를 공부했어요." },
      { plain: "화요일에 친구를 만났어요.", rich: "화요일 저녁에 친구를 만났어요. 그리고 식당에서 밥을 먹었어요." },
    ],
  },
};

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
