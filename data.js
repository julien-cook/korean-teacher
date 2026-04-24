// Korean Teacher — deck data
//
// Card shape:
//   { front, back, extra, tts }
// - front: big text on the front of the card
// - back:  primary answer on the back (romanization or Hangul)
// - extra: secondary info (letter name, meaning, or numeric value)
// - tts:   optional Korean string to speak; defaults to `front`

// ---------- Hangul: basic jamo ----------

const jamoBasic = [
  // 14 basic consonants — TTS pairs the consonant with ㅡ so the sound plays cleanly.
  { front: "ㄱ", back: "g / k",  extra: "giyeok",  tts: "그" },
  { front: "ㄴ", back: "n",       extra: "nieun",   tts: "느" },
  { front: "ㄷ", back: "d / t",   extra: "digeut",  tts: "드" },
  { front: "ㄹ", back: "r / l",   extra: "rieul",   tts: "르" },
  { front: "ㅁ", back: "m",       extra: "mieum",   tts: "므" },
  { front: "ㅂ", back: "b / p",   extra: "bieup",   tts: "브" },
  { front: "ㅅ", back: "s",       extra: "siot",    tts: "스" },
  { front: "ㅇ", back: "ng / —",  extra: "ieung",   tts: "으" },
  { front: "ㅈ", back: "j",       extra: "jieut",   tts: "즈" },
  { front: "ㅊ", back: "ch",      extra: "chieut",  tts: "츠" },
  { front: "ㅋ", back: "k",       extra: "kieuk",   tts: "크" },
  { front: "ㅌ", back: "t",       extra: "tieut",   tts: "트" },
  { front: "ㅍ", back: "p",       extra: "pieup",   tts: "프" },
  { front: "ㅎ", back: "h",       extra: "hieut",   tts: "흐" },
  // 10 basic vowels
  { front: "ㅏ", back: "a",   extra: "", tts: "아" },
  { front: "ㅑ", back: "ya",  extra: "", tts: "야" },
  { front: "ㅓ", back: "eo",  extra: "", tts: "어" },
  { front: "ㅕ", back: "yeo", extra: "", tts: "여" },
  { front: "ㅗ", back: "o",   extra: "", tts: "오" },
  { front: "ㅛ", back: "yo",  extra: "", tts: "요" },
  { front: "ㅜ", back: "u",   extra: "", tts: "우" },
  { front: "ㅠ", back: "yu",  extra: "", tts: "유" },
  { front: "ㅡ", back: "eu",  extra: "", tts: "으" },
  { front: "ㅣ", back: "i",   extra: "", tts: "이" },
];

// ---------- Hangul: advanced jamo ----------

const jamoAdvanced = [
  // 5 tense consonants — TTS pairs with ㅡ for the base sound.
  { front: "ㄲ", back: "kk", extra: "ssanggiyeok", tts: "끄" },
  { front: "ㄸ", back: "tt", extra: "ssangdigeut", tts: "뜨" },
  { front: "ㅃ", back: "pp", extra: "ssangbieup",  tts: "쁘" },
  { front: "ㅆ", back: "ss", extra: "ssangsiot",   tts: "쓰" },
  { front: "ㅉ", back: "jj", extra: "ssangjieut",  tts: "쯔" },
  // 11 compound vowels
  { front: "ㅐ", back: "ae",  extra: "", tts: "애" },
  { front: "ㅒ", back: "yae", extra: "", tts: "얘" },
  { front: "ㅔ", back: "e",   extra: "", tts: "에" },
  { front: "ㅖ", back: "ye",  extra: "", tts: "예" },
  { front: "ㅘ", back: "wa",  extra: "", tts: "와" },
  { front: "ㅙ", back: "wae", extra: "", tts: "왜" },
  { front: "ㅚ", back: "oe",  extra: "", tts: "외" },
  { front: "ㅝ", back: "wo",  extra: "", tts: "워" },
  { front: "ㅞ", back: "we",  extra: "", tts: "웨" },
  { front: "ㅟ", back: "wi",  extra: "", tts: "위" },
  { front: "ㅢ", back: "ui",  extra: "", tts: "의" },
];

// ---------- Syllable blocks ----------

const syllables = [
  // CV with ㅏ
  { front: "가", back: "ga", extra: "" },
  { front: "나", back: "na", extra: "" },
  { front: "다", back: "da", extra: "" },
  { front: "라", back: "ra", extra: "" },
  { front: "마", back: "ma", extra: "" },
  { front: "바", back: "ba", extra: "" },
  { front: "사", back: "sa", extra: "" },
  { front: "아", back: "a",  extra: "" },
  { front: "자", back: "ja", extra: "" },
  { front: "차", back: "cha", extra: "" },
  { front: "카", back: "ka", extra: "" },
  { front: "타", back: "ta", extra: "" },
  { front: "파", back: "pa", extra: "" },
  { front: "하", back: "ha", extra: "" },
  // CV with ㅓ
  { front: "서", back: "seo", extra: "" },
  { front: "어", back: "eo",  extra: "" },
  { front: "저", back: "jeo", extra: "" },
  // CV with ㅗ
  { front: "고", back: "go", extra: "" },
  { front: "도", back: "do", extra: "" },
  { front: "로", back: "ro", extra: "" },
  { front: "모", back: "mo", extra: "" },
  { front: "보", back: "bo", extra: "" },
  { front: "소", back: "so", extra: "" },
  { front: "오", back: "o",  extra: "" },
  { front: "조", back: "jo", extra: "" },
  // CV with ㅜ
  { front: "구", back: "gu", extra: "" },
  { front: "누", back: "nu", extra: "" },
  { front: "두", back: "du", extra: "" },
  { front: "무", back: "mu", extra: "" },
  { front: "부", back: "bu", extra: "" },
  { front: "수", back: "su", extra: "" },
  { front: "우", back: "u",  extra: "" },
  // CV with ㅣ
  { front: "기", back: "gi", extra: "" },
  { front: "니", back: "ni", extra: "" },
  { front: "리", back: "ri", extra: "" },
  { front: "미", back: "mi", extra: "" },
  { front: "비", back: "bi", extra: "" },
  { front: "시", back: "si", extra: "" },
  { front: "이", back: "i",  extra: "" },
  // CVC (with final consonant / batchim)
  { front: "안", back: "an",   extra: "" },
  { front: "각", back: "gak",  extra: "" },
  { front: "간", back: "gan",  extra: "" },
  { front: "감", back: "gam",  extra: "" },
  { front: "강", back: "gang", extra: "" },
  { front: "갈", back: "gal",  extra: "" },
  { front: "곰", back: "gom",  extra: "bear" },
  { front: "남", back: "nam",  extra: "" },
  { front: "말", back: "mal",  extra: "horse / word" },
  { front: "몸", back: "mom",  extra: "body" },
  { front: "밤", back: "bam",  extra: "night" },
  { front: "밥", back: "bap",  extra: "rice" },
  { front: "빵", back: "ppang", extra: "bread" },
  { front: "산", back: "san",  extra: "mountain" },
  { front: "상", back: "sang", extra: "" },
  { front: "선", back: "seon", extra: "" },
  { front: "손", back: "son",  extra: "hand" },
  { front: "술", back: "sul",  extra: "alcohol" },
  { front: "숨", back: "sum",  extra: "breath" },
  { front: "학", back: "hak",  extra: "" },
  { front: "한", back: "han",  extra: "" },
  { front: "해", back: "hae",  extra: "sun" },
];

// ---------- Common words (200) ----------

const words = [
  // Greetings & politeness
  { front: "안녕",           back: "annyeong",           extra: "hi (casual)" },
  { front: "안녕하세요",     back: "annyeonghaseyo",     extra: "hello" },
  { front: "안녕히 가세요",  back: "annyeonghi gaseyo",  extra: "goodbye (to one leaving)" },
  { front: "안녕히 계세요",  back: "annyeonghi gyeseyo", extra: "goodbye (to one staying)" },
  { front: "감사합니다",     back: "gamsahamnida",       extra: "thank you" },
  { front: "고맙습니다",     back: "gomapseumnida",      extra: "thank you" },
  { front: "고마워요",       back: "gomawoyo",           extra: "thanks" },
  { front: "천만에요",       back: "cheonmaneyo",        extra: "you're welcome" },
  { front: "네",             back: "ne",                 extra: "yes" },
  { front: "아니요",         back: "aniyo",              extra: "no" },
  { front: "괜찮아요",       back: "gwaenchanayo",       extra: "it's okay" },
  { front: "죄송합니다",     back: "joesonghamnida",     extra: "sorry (formal)" },
  { front: "미안해요",       back: "mianhaeyo",          extra: "sorry" },
  { front: "실례합니다",     back: "sillyehamnida",      extra: "excuse me" },
  { front: "잠시만요",       back: "jamsimanyo",         extra: "just a moment" },

  // People & pronouns
  { front: "나",             back: "na",                 extra: "I / me (casual)" },
  { front: "저",             back: "jeo",                extra: "I (polite)" },
  { front: "너",             back: "neo",                extra: "you (casual)" },
  { front: "당신",           back: "dangsin",            extra: "you (formal)" },
  { front: "우리",           back: "uri",                extra: "we / us" },
  { front: "사람",           back: "saram",              extra: "person" },
  { front: "남자",           back: "namja",              extra: "man" },
  { front: "여자",           back: "yeoja",              extra: "woman" },
  { front: "아이",           back: "ai",                 extra: "child" },
  { front: "아기",           back: "agi",                extra: "baby" },
  { front: "학생",           back: "haksaeng",           extra: "student" },
  { front: "선생님",         back: "seonsaengnim",       extra: "teacher" },
  { front: "의사",           back: "uisa",               extra: "doctor" },
  { front: "친구",           back: "chingu",             extra: "friend" },
  { front: "이름",           back: "ireum",              extra: "name" },

  // Family
  { front: "가족",           back: "gajok",              extra: "family" },
  { front: "엄마",           back: "eomma",              extra: "mom" },
  { front: "아빠",           back: "appa",               extra: "dad" },
  { front: "어머니",         back: "eomeoni",            extra: "mother" },
  { front: "아버지",         back: "abeoji",             extra: "father" },
  { front: "형",             back: "hyeong",             extra: "older brother (said by men)" },
  { front: "누나",           back: "nuna",               extra: "older sister (said by men)" },
  { front: "오빠",           back: "oppa",               extra: "older brother (said by women)" },
  { front: "언니",           back: "eonni",              extra: "older sister (said by women)" },
  { front: "동생",           back: "dongsaeng",          extra: "younger sibling" },
  { front: "할머니",         back: "halmeoni",           extra: "grandmother" },
  { front: "할아버지",       back: "harabeoji",          extra: "grandfather" },
  { front: "아들",           back: "adeul",              extra: "son" },
  { front: "딸",             back: "ttal",               extra: "daughter" },

  // Food & drink
  { front: "밥",             back: "bap",                extra: "rice / meal" },
  { front: "물",             back: "mul",                extra: "water" },
  { front: "우유",           back: "uyu",                extra: "milk" },
  { front: "커피",           back: "keopi",              extra: "coffee" },
  { front: "차",             back: "cha",                extra: "tea / car" },
  { front: "주스",           back: "juseu",              extra: "juice" },
  { front: "맥주",           back: "maekju",             extra: "beer" },
  { front: "와인",           back: "wain",               extra: "wine" },
  { front: "김치",           back: "kimchi",             extra: "kimchi" },
  { front: "김밥",           back: "gimbap",             extra: "gimbap" },
  { front: "비빔밥",         back: "bibimbap",           extra: "bibimbap" },
  { front: "불고기",         back: "bulgogi",            extra: "bulgogi" },
  { front: "라면",           back: "ramyeon",            extra: "ramen" },
  { front: "국",             back: "guk",                extra: "soup" },
  { front: "찌개",           back: "jjigae",             extra: "stew" },
  { front: "고기",           back: "gogi",               extra: "meat" },
  { front: "소고기",         back: "sogogi",             extra: "beef" },
  { front: "돼지고기",       back: "dwaejigogi",         extra: "pork" },
  { front: "닭고기",         back: "dakgogi",            extra: "chicken (meat)" },
  { front: "생선",           back: "saengseon",          extra: "fish (food)" },
  { front: "야채",           back: "yachae",             extra: "vegetables" },
  { front: "과일",           back: "gwail",              extra: "fruit" },
  { front: "사과",           back: "sagwa",              extra: "apple" },
  { front: "바나나",         back: "banana",             extra: "banana" },
  { front: "딸기",           back: "ttalgi",             extra: "strawberry" },
  { front: "빵",             back: "ppang",              extra: "bread" },
  { front: "계란",           back: "gyeran",             extra: "egg" },
  { front: "치즈",           back: "chiju",              extra: "cheese" },
  { front: "소금",           back: "sogeum",             extra: "salt" },
  { front: "설탕",           back: "seoltang",           extra: "sugar" },

  // Places
  { front: "집",             back: "jip",                extra: "house / home" },
  { front: "학교",           back: "hakgyo",             extra: "school" },
  { front: "회사",           back: "hoesa",              extra: "company / office" },
  { front: "식당",           back: "sikdang",            extra: "restaurant" },
  { front: "카페",           back: "kape",               extra: "cafe" },
  { front: "가게",           back: "gage",               extra: "shop" },
  { front: "시장",           back: "sijang",             extra: "market" },
  { front: "은행",           back: "eunhaeng",           extra: "bank" },
  { front: "공항",           back: "gonghang",           extra: "airport" },
  { front: "역",             back: "yeok",               extra: "station" },
  { front: "호텔",           back: "hotel",              extra: "hotel" },
  { front: "병원",           back: "byeongwon",          extra: "hospital" },
  { front: "공원",           back: "gongwon",            extra: "park" },
  { front: "화장실",         back: "hwajangsil",         extra: "bathroom" },
  { front: "방",             back: "bang",               extra: "room" },
  { front: "부엌",           back: "bueok",              extra: "kitchen" },
  { front: "한국",           back: "hanguk",             extra: "Korea" },
  { front: "서울",           back: "seoul",              extra: "Seoul" },
  { front: "미국",           back: "miguk",              extra: "USA" },
  { front: "일본",           back: "ilbon",              extra: "Japan" },
  { front: "중국",           back: "jungguk",            extra: "China" },
  { front: "영국",           back: "yeongguk",           extra: "UK" },

  // Time
  { front: "지금",           back: "jigeum",             extra: "now" },
  { front: "오늘",           back: "oneul",              extra: "today" },
  { front: "내일",           back: "naeil",              extra: "tomorrow" },
  { front: "어제",           back: "eoje",               extra: "yesterday" },
  { front: "아침",           back: "achim",              extra: "morning" },
  { front: "점심",           back: "jeomsim",            extra: "lunch / noon" },
  { front: "저녁",           back: "jeonyeok",           extra: "evening" },
  { front: "밤",             back: "bam",                extra: "night" },
  { front: "시간",           back: "sigan",              extra: "time / hour" },
  { front: "분",             back: "bun",                extra: "minute" },
  { front: "초",             back: "cho",                extra: "second" },
  { front: "주",             back: "ju",                 extra: "week" },
  { front: "달",             back: "dal",                extra: "month / moon" },
  { front: "년",             back: "nyeon",              extra: "year" },
  { front: "이번 주",        back: "ibeon ju",           extra: "this week" },
  { front: "다음 주",        back: "daeum ju",           extra: "next week" },
  { front: "지난 주",        back: "jinan ju",           extra: "last week" },

  // Days of the week
  { front: "월요일",         back: "woryoil",            extra: "Monday" },
  { front: "화요일",         back: "hwayoil",            extra: "Tuesday" },
  { front: "수요일",         back: "suyoil",             extra: "Wednesday" },
  { front: "목요일",         back: "mogyoil",            extra: "Thursday" },
  { front: "금요일",         back: "geumyoil",           extra: "Friday" },
  { front: "토요일",         back: "toyoil",             extra: "Saturday" },
  { front: "일요일",         back: "iryoil",             extra: "Sunday" },

  // Weather & nature
  { front: "날씨",           back: "nalssi",             extra: "weather" },
  { front: "비",             back: "bi",                 extra: "rain" },
  { front: "눈",             back: "nun",                extra: "snow / eye" },
  { front: "바람",           back: "baram",              extra: "wind" },
  { front: "해",             back: "hae",                extra: "sun" },
  { front: "별",             back: "byeol",              extra: "star" },
  { front: "하늘",           back: "haneul",             extra: "sky" },
  { front: "나무",           back: "namu",               extra: "tree" },
  { front: "꽃",             back: "kkot",               extra: "flower" },
  { front: "산",             back: "san",                extra: "mountain" },

  // Colors
  { front: "색",             back: "saek",               extra: "color" },
  { front: "빨간색",         back: "ppalgansaek",        extra: "red" },
  { front: "파란색",         back: "paransaek",          extra: "blue" },
  { front: "노란색",         back: "noransaek",          extra: "yellow" },
  { front: "초록색",         back: "choroksaek",         extra: "green" },
  { front: "검은색",         back: "geomeunsaek",        extra: "black" },
  { front: "흰색",           back: "huinsaek",           extra: "white" },

  // Body
  { front: "머리",           back: "meori",              extra: "head / hair" },
  { front: "얼굴",           back: "eolgul",             extra: "face" },
  { front: "코",             back: "ko",                 extra: "nose" },
  { front: "입",             back: "ip",                 extra: "mouth" },
  { front: "귀",             back: "gwi",                extra: "ear" },
  { front: "손",             back: "son",                extra: "hand" },
  { front: "발",             back: "bal",                extra: "foot" },
  { front: "다리",           back: "dari",               extra: "leg" },
  { front: "배",             back: "bae",                extra: "stomach / pear" },

  // Animals
  { front: "동물",           back: "dongmul",            extra: "animal" },
  { front: "개",             back: "gae",                extra: "dog" },
  { front: "고양이",         back: "goyangi",            extra: "cat" },
  { front: "새",             back: "sae",                extra: "bird" },
  { front: "물고기",         back: "mulgogi",            extra: "fish (alive)" },
  { front: "소",             back: "so",                 extra: "cow" },
  { front: "돼지",           back: "dwaeji",             extra: "pig" },
  { front: "곰",             back: "gom",                extra: "bear" },
  { front: "호랑이",         back: "horangi",            extra: "tiger" },
  { front: "말",             back: "mal",                extra: "horse / word" },

  // Daily objects
  { front: "책",             back: "chaek",              extra: "book" },
  { front: "전화",           back: "jeonhwa",            extra: "phone" },
  { front: "컴퓨터",         back: "keompyuteo",         extra: "computer" },
  { front: "시계",           back: "sigye",              extra: "clock / watch" },
  { front: "가방",           back: "gabang",             extra: "bag" },
  { front: "옷",             back: "ot",                 extra: "clothes" },
  { front: "신발",           back: "sinbal",             extra: "shoes" },
  { front: "모자",           back: "moja",               extra: "hat" },
  { front: "안경",           back: "angyeong",           extra: "glasses" },
  { front: "열쇠",           back: "yeolsoe",            extra: "key" },
  { front: "돈",             back: "don",                extra: "money" },
  { front: "자동차",         back: "jadongcha",          extra: "car" },

  // Verbs (dictionary form)
  { front: "가다",           back: "gada",               extra: "to go" },
  { front: "오다",           back: "oda",                extra: "to come" },
  { front: "먹다",           back: "meokda",             extra: "to eat" },
  { front: "마시다",         back: "masida",             extra: "to drink" },
  { front: "보다",           back: "boda",               extra: "to see / watch" },
  { front: "듣다",           back: "deutda",             extra: "to listen" },
  { front: "말하다",         back: "malhada",            extra: "to speak" },
  { front: "읽다",           back: "ikda",               extra: "to read" },
  { front: "쓰다",           back: "sseuda",             extra: "to write / use" },
  { front: "하다",           back: "hada",               extra: "to do" },
  { front: "자다",           back: "jada",               extra: "to sleep" },
  { front: "만나다",         back: "mannada",            extra: "to meet" },
  { front: "공부하다",       back: "gongbuhada",         extra: "to study" },
  { front: "일하다",         back: "ilhada",             extra: "to work" },
  { front: "사랑하다",       back: "saranghada",         extra: "to love" },

  // Descriptive verbs / adjectives
  { front: "크다",           back: "keuda",              extra: "to be big" },
  { front: "작다",           back: "jakda",              extra: "to be small" },
  { front: "좋다",           back: "jota",               extra: "to be good" },
  { front: "나쁘다",         back: "nappeuda",           extra: "to be bad" },
  { front: "예쁘다",         back: "yeppeuda",           extra: "to be pretty" },
  { front: "맛있다",         back: "masitda",            extra: "to be delicious" },
  { front: "쉽다",           back: "swipda",             extra: "to be easy" },
  { front: "어렵다",         back: "eoryeopda",          extra: "to be difficult" },
  { front: "빠르다",         back: "ppareuda",           extra: "to be fast" },
  { front: "느리다",         back: "neurida",            extra: "to be slow" },
  { front: "덥다",           back: "deopda",             extra: "to be hot (weather)" },
  { front: "춥다",           back: "chupda",             extra: "to be cold (weather)" },

  // Misc / common polite forms
  { front: "사랑",           back: "sarang",             extra: "love" },
  { front: "좋아요",         back: "joayo",              extra: "good / I like it" },
  { front: "싫어요",         back: "sireoyo",            extra: "I don't like it" },
  { front: "많이",           back: "mani",               extra: "a lot" },
  { front: "조금",           back: "jogeum",             extra: "a little" },
];

// ---------- Sino-Korean numbers (static list) ----------

const sinoNumbers = [
  { front: "영",           back: "yeong",             extra: "0" },
  { front: "공",           back: "gong",              extra: "0 (phone/pin)" },
  { front: "일",           back: "il",                extra: "1" },
  { front: "이",           back: "i",                 extra: "2" },
  { front: "삼",           back: "sam",               extra: "3" },
  { front: "사",           back: "sa",                extra: "4" },
  { front: "오",           back: "o",                 extra: "5" },
  { front: "육",           back: "yuk",               extra: "6" },
  { front: "칠",           back: "chil",              extra: "7" },
  { front: "팔",           back: "pal",               extra: "8" },
  { front: "구",           back: "gu",                extra: "9" },
  { front: "십",           back: "sip",               extra: "10" },
  { front: "십일",         back: "sibil",             extra: "11" },
  { front: "이십",         back: "isip",              extra: "20" },
  { front: "이십삼",       back: "isipsam",           extra: "23" },
  { front: "오십",         back: "osip",              extra: "50" },
  { front: "구십구",       back: "gusipgu",           extra: "99" },
  { front: "백",           back: "baek",              extra: "100" },
  { front: "칠백오",       back: "chilbaeko",         extra: "705" },
  { front: "천",           back: "cheon",             extra: "1,000" },
  { front: "만",           back: "man",               extra: "10,000" },
  { front: "만이천",       back: "manicheon",         extra: "12,000" },
];

// ---------- Native Korean numbers (static list) ----------

const nativeNumbers = [
  { front: "하나",         back: "hana",              extra: "1" },
  { front: "둘",           back: "dul",               extra: "2" },
  { front: "셋",           back: "set",               extra: "3" },
  { front: "넷",           back: "net",               extra: "4" },
  { front: "다섯",         back: "daseot",            extra: "5" },
  { front: "여섯",         back: "yeoseot",           extra: "6" },
  { front: "일곱",         back: "ilgop",             extra: "7" },
  { front: "여덟",         back: "yeodeol",           extra: "8" },
  { front: "아홉",         back: "ahop",              extra: "9" },
  { front: "열",           back: "yeol",              extra: "10" },
  { front: "스물",         back: "seumul",            extra: "20" },
  { front: "서른",         back: "seoreun",           extra: "30" },
  { front: "마흔",         back: "maheun",            extra: "40" },
  { front: "쉰",           back: "swin",              extra: "50" },
  { front: "예순",         back: "yesun",             extra: "60" },
  { front: "일흔",         back: "ilheun",            extra: "70" },
  { front: "여든",         back: "yeodeun",           extra: "80" },
  { front: "아흔",         back: "aheun",             extra: "90" },
  { front: "스물셋",       back: "seumulset",         extra: "23" },
  { front: "일흔다섯",     back: "ilheundaseot",      extra: "75" },
];

// ---------- Common phrases (200) ----------

const phrases = [
  // Greetings
  { front: "안녕하세요",                back: "annyeonghaseyo",              extra: "hello" },
  { front: "안녕히 가세요",             back: "annyeonghi gaseyo",           extra: "goodbye (to one leaving)" },
  { front: "안녕히 계세요",             back: "annyeonghi gyeseyo",          extra: "goodbye (to one staying)" },
  { front: "잘 자요",                   back: "jal jayo",                    extra: "good night / sleep well" },
  { front: "좋은 아침이에요",           back: "joeun achimieyo",             extra: "good morning" },
  { front: "오랜만이에요",              back: "oraenmanieyo",                extra: "long time no see" },
  { front: "만나서 반가워요",           back: "mannaseo bangawoyo",          extra: "nice to meet you" },
  { front: "반갑습니다",                back: "bangapseumnida",              extra: "nice to meet you (formal)" },
  { front: "어서 오세요",               back: "eoseo oseyo",                 extra: "welcome" },
  { front: "잘 지내요?",                back: "jal jinaeyo?",                extra: "how are you?" },
  { front: "잘 지내요",                 back: "jal jinaeyo",                 extra: "I'm well" },
  { front: "어떻게 지내요?",            back: "eotteoke jinaeyo?",           extra: "how are you doing?" },
  { front: "그냥 그래요",               back: "geunyang geuraeyo",           extra: "so-so" },
  { front: "또 봐요",                   back: "tto bwayo",                   extra: "see you again" },
  { front: "다음에 봐요",               back: "daeume bwayo",                extra: "see you next time" },

  // Introductions
  { front: "제 이름은 ___이에요",       back: "je ireumeun ___ ieyo",        extra: "my name is ___" },
  { front: "이름이 뭐예요?",            back: "ireumi mwoyeyo?",             extra: "what's your name?" },
  { front: "이름이 어떻게 되세요?",     back: "ireumi eotteoke doeseyo?",    extra: "what is your name? (polite)" },
  { front: "저는 학생이에요",           back: "jeoneun haksaengieyo",        extra: "I'm a student" },
  { front: "어디에서 왔어요?",          back: "eodieseo wasseoyo?",          extra: "where are you from?" },
  { front: "저는 미국에서 왔어요",      back: "jeoneun migugeseo wasseoyo",  extra: "I'm from the USA" },
  { front: "한국 사람이에요?",          back: "hanguk saramieyo?",           extra: "are you Korean?" },
  { front: "나이가 어떻게 되세요?",     back: "naiga eotteoke doeseyo?",     extra: "how old are you? (polite)" },
  { front: "몇 살이에요?",              back: "myeot sarieyo?",              extra: "how old are you?" },
  { front: "잘 부탁드립니다",           back: "jal butakdeurimnida",         extra: "please take care of me" },
  { front: "직업이 뭐예요?",            back: "jigeobi mwoyeyo?",            extra: "what's your job?" },
  { front: "취미가 뭐예요?",            back: "chwimiga mwoyeyo?",           extra: "what's your hobby?" },

  // Thanks / apologies
  { front: "정말 감사합니다",           back: "jeongmal gamsahamnida",       extra: "thank you very much" },
  { front: "고마워요",                  back: "gomawoyo",                    extra: "thanks" },
  { front: "천만에요",                  back: "cheonmaneyo",                 extra: "you're welcome" },
  { front: "아니에요",                  back: "anieyo",                      extra: "it's nothing / don't mention it" },
  { front: "죄송합니다",                back: "joesonghamnida",              extra: "sorry (formal)" },
  { front: "미안해요",                  back: "mianhaeyo",                   extra: "sorry" },
  { front: "괜찮아요",                  back: "gwaenchanayo",                extra: "it's okay" },
  { front: "실례합니다",                back: "sillyehamnida",               extra: "excuse me" },
  { front: "양해해 주세요",             back: "yanghaehae juseyo",           extra: "please understand" },
  { front: "제 잘못이에요",             back: "je jalmosieyo",               extra: "it's my fault" },

  // Basic responses
  { front: "네",                        back: "ne",                          extra: "yes" },
  { front: "아니요",                    back: "aniyo",                       extra: "no" },
  { front: "맞아요",                    back: "majayo",                      extra: "that's right" },
  { front: "틀려요",                    back: "teullyeoyo",                  extra: "that's wrong" },
  { front: "알아요",                    back: "arayo",                       extra: "I know" },
  { front: "몰라요",                    back: "mollayo",                     extra: "I don't know" },
  { front: "이해해요",                  back: "ihaehaeyo",                   extra: "I understand" },
  { front: "이해 못했어요",             back: "ihae mottaesseoyo",           extra: "I didn't understand" },
  { front: "물론이에요",                back: "mullonieyo",                  extra: "of course" },
  { front: "물론이죠",                  back: "mullonijyo",                  extra: "of course" },
  { front: "아마도",                    back: "amado",                       extra: "maybe" },
  { front: "그럼요",                    back: "geureomyo",                   extra: "of course" },
  { front: "잘 모르겠어요",             back: "jal moreugesseoyo",           extra: "I'm not sure" },
  { front: "저도요",                    back: "jeodoyo",                     extra: "me too" },
  { front: "저도 그래요",               back: "jeodo geuraeyo",              extra: "same here" },

  // Questions
  { front: "뭐예요?",                   back: "mwoyeyo?",                    extra: "what is it?" },
  { front: "누구세요?",                 back: "nuguseyo?",                   extra: "who is it?" },
  { front: "어디예요?",                 back: "eodiyeyo?",                   extra: "where is it?" },
  { front: "언제요?",                   back: "eonjeyo?",                    extra: "when?" },
  { front: "왜요?",                     back: "waeyo?",                      extra: "why?" },
  { front: "어떻게요?",                 back: "eotteokeyo?",                 extra: "how?" },
  { front: "얼마예요?",                 back: "eolmayeyo?",                  extra: "how much?" },
  { front: "뭐라고요?",                 back: "mworagoyo?",                  extra: "what did you say?" },
  { front: "무슨 뜻이에요?",            back: "museun tteusieyo?",           extra: "what does it mean?" },
  { front: "어떻게 말해요?",            back: "eotteoke malhaeyo?",          extra: "how do you say it?" },
  { front: "맞죠?",                     back: "majjyo?",                     extra: "right?" },
  { front: "진짜요?",                   back: "jinjjayo?",                   extra: "really?" },

  // Help / travel
  { front: "도와주세요",                back: "dowajuseyo",                  extra: "please help me" },
  { front: "화장실이 어디예요?",        back: "hwajangsiri eodiyeyo?",       extra: "where is the bathroom?" },
  { front: "이거 얼마예요?",            back: "igeo eolmayeyo?",             extra: "how much is this?" },
  { front: "너무 비싸요",               back: "neomu bissayo",               extra: "too expensive" },
  { front: "깎아 주세요",               back: "kkakka juseyo",               extra: "please give me a discount" },
  { front: "이거 주세요",               back: "igeo juseyo",                 extra: "please give me this" },
  { front: "영어 할 수 있어요?",        back: "yeongeo hal su isseoyo?",     extra: "do you speak English?" },
  { front: "한국어 조금 할 수 있어요",  back: "hangugeo jogeum hal su isseoyo", extra: "I speak a little Korean" },
  { front: "천천히 말해 주세요",        back: "cheoncheonhi malhae juseyo",  extra: "please speak slowly" },
  { front: "다시 말해 주세요",          back: "dasi malhae juseyo",          extra: "please say it again" },
  { front: "길을 잃었어요",             back: "gireul ireosseoyo",           extra: "I'm lost" },
  { front: "택시 불러 주세요",          back: "taeksi bulleo juseyo",        extra: "please call a taxi" },
  { front: "여기에 세워 주세요",        back: "yeogie sewo juseyo",          extra: "please stop here" },
  { front: "계산서 주세요",             back: "gyesanseo juseyo",            extra: "please bring the bill" },
  { front: "영수증 주세요",             back: "yeongsujeung juseyo",         extra: "please give me a receipt" },
  { front: "와이파이 있어요?",          back: "waipai isseoyo?",             extra: "is there wifi?" },
  { front: "비밀번호가 뭐예요?",        back: "bimilbeonhoga mwoyeyo?",      extra: "what's the password?" },
  { front: "예약했어요",                back: "yeyakaesseoyo",               extra: "I have a reservation" },

  // Food / restaurant
  { front: "배고파요",                  back: "baegopayo",                   extra: "I'm hungry" },
  { front: "목말라요",                  back: "mongmallayo",                 extra: "I'm thirsty" },
  { front: "배불러요",                  back: "baebulleoyo",                 extra: "I'm full" },
  { front: "맛있어요",                  back: "masisseoyo",                  extra: "it's delicious" },
  { front: "맛없어요",                  back: "madeopseoyo",                 extra: "it's not tasty" },
  { front: "매워요",                    back: "maewoyo",                     extra: "it's spicy" },
  { front: "짜요",                      back: "jjayo",                       extra: "it's salty" },
  { front: "달아요",                    back: "darayo",                      extra: "it's sweet" },
  { front: "메뉴 주세요",               back: "menyu juseyo",                extra: "menu, please" },
  { front: "물 주세요",                 back: "mul juseyo",                  extra: "water, please" },
  { front: "한 잔 더 주세요",           back: "han jan deo juseyo",          extra: "one more glass please" },
  { front: "건배",                      back: "geonbae",                     extra: "cheers" },
  { front: "잘 먹겠습니다",             back: "jal meokgetseumnida",         extra: "thanks for the meal (before eating)" },
  { front: "잘 먹었습니다",             back: "jal meogeotseumnida",         extra: "thanks for the meal (after eating)" },
  { front: "맛있게 드세요",             back: "masitge deuseyo",             extra: "enjoy your meal" },

  // Shopping / directions
  { front: "이것은 뭐예요?",            back: "igeoseun mwoyeyo?",           extra: "what is this?" },
  { front: "저것은 뭐예요?",            back: "jeogeoseun mwoyeyo?",         extra: "what is that?" },
  { front: "어디에 있어요?",            back: "eodie isseoyo?",              extra: "where is it?" },
  { front: "여기 있어요",               back: "yeogi isseoyo",               extra: "it's here" },
  { front: "저기 있어요",               back: "jeogi isseoyo",               extra: "it's over there" },
  { front: "오른쪽으로 가세요",         back: "oreunjjogeuro gaseyo",        extra: "go right" },
  { front: "왼쪽으로 가세요",           back: "oenjjogeuro gaseyo",          extra: "go left" },
  { front: "똑바로 가세요",             back: "ttokbaro gaseyo",             extra: "go straight" },
  { front: "멀어요?",                   back: "meoreoyo?",                   extra: "is it far?" },
  { front: "가까워요",                  back: "gakkawoyo",                   extra: "it's close" },
  { front: "더 작은 것 있어요?",        back: "deo jageun geot isseoyo?",    extra: "do you have a smaller one?" },
  { front: "더 큰 것 있어요?",          back: "deo keun geot isseoyo?",      extra: "do you have a bigger one?" },
  { front: "다른 색 있어요?",           back: "dareun saek isseoyo?",        extra: "do you have another color?" },
  { front: "카드로 계산할게요",         back: "kadeuro gyesanhalgeyo",       extra: "I'll pay by card" },

  // Feelings / states
  { front: "좋아요",                    back: "joayo",                       extra: "I like it / it's good" },
  { front: "싫어요",                    back: "sireoyo",                     extra: "I don't like it" },
  { front: "피곤해요",                  back: "pigonhaeyo",                  extra: "I'm tired" },
  { front: "졸려요",                    back: "jollyeoyo",                   extra: "I'm sleepy" },
  { front: "기뻐요",                    back: "gippeoyo",                    extra: "I'm happy" },
  { front: "슬퍼요",                    back: "seulpeoyo",                   extra: "I'm sad" },
  { front: "화가 났어요",               back: "hwaga nasseoyo",              extra: "I'm angry" },
  { front: "심심해요",                  back: "simsimhaeyo",                 extra: "I'm bored" },
  { front: "재미있어요",                back: "jaemiisseoyo",                extra: "it's fun" },
  { front: "재미없어요",                back: "jaemieopseoyo",               extra: "it's not fun" },
  { front: "아파요",                    back: "apayo",                       extra: "it hurts / I'm sick" },
  { front: "괜찮아요?",                 back: "gwaenchanayo?",               extra: "are you okay?" },
  { front: "사랑해요",                  back: "saranghaeyo",                 extra: "I love you" },
  { front: "보고 싶어요",               back: "bogo sipeoyo",                extra: "I miss you" },
  { front: "축하해요",                  back: "chukahaeyo",                  extra: "congratulations" },

  // Time / scheduling
  { front: "지금 몇 시예요?",           back: "jigeum myeot siyeyo?",        extra: "what time is it now?" },
  { front: "오늘 며칠이에요?",          back: "oneul myeochirieyo?",         extra: "what's the date today?" },
  { front: "오늘 무슨 요일이에요?",     back: "oneul museun yoirieyo?",      extra: "what day is today?" },
  { front: "언제 만날까요?",            back: "eonje mannalkkayo?",          extra: "when should we meet?" },
  { front: "내일 봐요",                 back: "naeil bwayo",                 extra: "see you tomorrow" },
  { front: "나중에 봐요",               back: "najunge bwayo",               extra: "see you later" },
  { front: "빨리 오세요",               back: "ppalli oseyo",                extra: "come quickly" },
  { front: "조금만 기다려 주세요",      back: "jogeumman gidaryeo juseyo",   extra: "please wait a moment" },
  { front: "시간이 없어요",             back: "sigani eopseoyo",             extra: "I don't have time" },
  { front: "바빠요",                    back: "bappayo",                     extra: "I'm busy" },
  { front: "한가해요",                  back: "hangahaeyo",                  extra: "I'm free" },
  { front: "생일 축하해요",             back: "saengil chukahaeyo",          extra: "happy birthday" },

  // Weather
  { front: "날씨가 좋아요",             back: "nalssiga joayo",              extra: "the weather is nice" },
  { front: "날씨가 나빠요",             back: "nalssiga nappayo",            extra: "the weather is bad" },
  { front: "더워요",                    back: "deowoyo",                     extra: "it's hot" },
  { front: "추워요",                    back: "chuwoyo",                     extra: "it's cold" },
  { front: "비가 와요",                 back: "biga wayo",                   extra: "it's raining" },
  { front: "눈이 와요",                 back: "nuni wayo",                   extra: "it's snowing" },
  { front: "바람이 불어요",             back: "barami bureoyo",              extra: "the wind is blowing" },
  { front: "해가 나요",                 back: "haega nayo",                  extra: "the sun is out" },
  { front: "흐려요",                    back: "heuryeoyo",                   extra: "it's cloudy" },
  { front: "따뜻해요",                  back: "ttatteutaeyo",                extra: "it's warm" },

  // Common expressions
  { front: "화이팅",                    back: "hwaiting",                    extra: "fighting / go for it" },
  { front: "대박",                      back: "daebak",                      extra: "awesome" },
  { front: "정말요?",                   back: "jeongmaryo?",                 extra: "really?" },
  { front: "잘했어요",                  back: "jalhaesseoyo",                extra: "good job" },
  { front: "힘내세요",                  back: "himnaeseyo",                  extra: "cheer up / hang in there" },
  { front: "수고하셨어요",              back: "sugohasyeosseoyo",            extra: "great work" },
  { front: "수고하세요",                back: "sugohaseyo",                  extra: "keep up the good work" },
  { front: "조심하세요",                back: "josimhaseyo",                 extra: "be careful" },
  { front: "조용히 하세요",             back: "joyonghi haseyo",             extra: "please be quiet" },
  { front: "앉으세요",                  back: "anjeuseyo",                   extra: "please sit down" },
  { front: "일어나세요",                back: "ireonaseyo",                  extra: "please stand up" },
  { front: "들어오세요",                back: "deureooseyo",                 extra: "please come in" },
  { front: "나가세요",                  back: "nagaseyo",                    extra: "please leave" },
  { front: "이쪽으로 오세요",           back: "ijjogeuro oseyo",             extra: "come this way" },
  { front: "빨리요",                    back: "ppalliyo",                    extra: "quickly, please" },

  // Daily life
  { front: "어디 가요?",                back: "eodi gayo?",                  extra: "where are you going?" },
  { front: "집에 가요",                 back: "jibe gayo",                   extra: "I'm going home" },
  { front: "다녀오세요",                back: "danyeooseyo",                 extra: "have a good trip / see you later" },
  { front: "다녀왔어요",                back: "danyeowasseoyo",              extra: "I'm home / I'm back" },
  { front: "한국어 공부해요",           back: "hangugeo gongbuhaeyo",        extra: "I'm studying Korean" },
  { front: "한국에 살아요",             back: "hanguge arayo",               extra: "I live in Korea" },
  { front: "잘 가요",                   back: "jal gayo",                    extra: "take care / bye" },
  { front: "잘 지내세요",               back: "jal jinaeseyo",               extra: "take care" },
  { front: "몸조심하세요",              back: "momjosimhaseyo",              extra: "take care of yourself" },
  { front: "푹 쉬세요",                 back: "puk swiseyo",                 extra: "rest well" },
  { front: "빨리 나으세요",             back: "ppalli naeuseyo",             extra: "get well soon" },
  { front: "많이 드세요",               back: "mani deuseyo",                extra: "eat a lot" },
  { front: "천천히 드세요",             back: "cheoncheonhi deuseyo",        extra: "eat slowly" },
  { front: "안녕히 주무세요",           back: "annyeonghi jumuseyo",         extra: "sleep well (formal)" },
  { front: "또 뵙겠습니다",             back: "tto boepgetseumnida",         extra: "see you again (formal)" },

  // Getting attention / softeners
  { front: "여기요",                    back: "yeogiyo",                     extra: "excuse me (to get attention)" },
  { front: "저기요",                    back: "jeogiyo",                     extra: "excuse me (over there)" },
  { front: "잠깐만요",                  back: "jamkkanmanyo",                extra: "wait a moment" },
  { front: "잠시만 기다려 주세요",      back: "jamsiman gidaryeo juseyo",    extra: "please wait a moment" },
  { front: "다시 한 번",                back: "dasi han beon",               extra: "one more time" },
  { front: "한번 해 볼게요",            back: "hanbeon hae bolgeyo",         extra: "I'll give it a try" },
  { front: "문 좀 열어 주세요",         back: "mun jom yeoreo juseyo",       extra: "please open the door" },
  { front: "문 닫아 주세요",            back: "mun dada juseyo",             extra: "please close the door" },
  { front: "사진 찍어 주세요",          back: "sajin jjigeo juseyo",         extra: "please take a picture" },
  { front: "사진 찍어도 돼요?",         back: "sajin jjigeodo dwaeyo?",      extra: "can I take a picture?" },
  { front: "앉아도 돼요?",              back: "anjado dwaeyo?",              extra: "may I sit down?" },
  { front: "담배 피워도 돼요?",         back: "dambae piwodo dwaeyo?",       extra: "may I smoke?" },

  // Opinions / agreement
  { front: "어떻게 생각해요?",          back: "eotteoke saenggakaeyo?",      extra: "what do you think?" },
  { front: "괜찮을 것 같아요",          back: "gwaenchaneul geot gatayo",    extra: "I think it'll be fine" },
  { front: "좋은 생각이에요",           back: "joeun saenggagieyo",          extra: "that's a good idea" },
  { front: "별로예요",                  back: "byeolloyeyo",                 extra: "not really / so-so" },
  { front: "그건 좀 어려워요",          back: "geugeon jom eoryeowoyo",      extra: "that's a bit difficult" },
  { front: "찬성해요",                  back: "chanseonghaeyo",              extra: "I agree" },
  { front: "반대해요",                  back: "bandaehaeyo",                 extra: "I disagree" },
  { front: "같이 가요",                 back: "gati gayo",                   extra: "let's go together" },
  { front: "먼저 가세요",               back: "meonjeo gaseyo",              extra: "you go first" },
  { front: "할 수 있어요",              back: "hal su isseoyo",              extra: "you/I can do it" },
];

// ---------- Arabic → Korean (runtime generator) ----------

const SINO_DIGITS = ["영","일","이","삼","사","오","육","칠","팔","구"];
const SINO_DIGITS_R = ["yeong","il","i","sam","sa","o","yuk","chil","pal","gu"];
const SINO_PLACES = [
  { v: 10000, u: "만", r: "man" },
  { v: 1000,  u: "천", r: "cheon" },
  { v: 100,   u: "백", r: "baek" },
  { v: 10,    u: "십", r: "sip" },
];

function toSino(n) {
  if (n === 0) return { hangul: "영", roman: "yeong" };
  let hangul = "", roman = "", rem = n;
  for (const { v, u, r } of SINO_PLACES) {
    const d = Math.floor(rem / v);
    if (d > 0) {
      if (d === 1) {
        hangul += u;
        roman  += r;
      } else {
        hangul += SINO_DIGITS[d] + u;
        roman  += SINO_DIGITS_R[d] + r;
      }
    }
    rem = rem % v;
  }
  if (rem > 0) {
    hangul += SINO_DIGITS[rem];
    roman  += SINO_DIGITS_R[rem];
  }
  return { hangul, roman };
}

const NATIVE_ONES = ["", "하나","둘","셋","넷","다섯","여섯","일곱","여덟","아홉"];
const NATIVE_ONES_R = ["", "hana","dul","set","net","daseot","yeoseot","ilgop","yeodeol","ahop"];
const NATIVE_TENS = ["", "열","스물","서른","마흔","쉰","예순","일흔","여든","아흔"];
const NATIVE_TENS_R = ["", "yeol","seumul","seoreun","maheun","swin","yesun","ilheun","yeodeun","aheun"];

function toNative(n) {
  if (n < 1 || n > 99) return null;
  const t = Math.floor(n / 10);
  const o = n % 10;
  return {
    hangul: NATIVE_TENS[t] + NATIVE_ONES[o],
    roman:  NATIVE_TENS_R[t] + NATIVE_ONES_R[o],
  };
}

function generateArabicToKorean({ count = 20, min = 1, max = 99, system = "sino" } = {}) {
  const cards = [];
  const seen = new Set();
  let safety = count * 5;
  while (cards.length < count && safety-- > 0) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (seen.has(n)) continue;
    const ko = system === "native" ? toNative(n) : toSino(n);
    if (!ko) continue;
    seen.add(n);
    cards.push({
      front: String(n),
      back:  ko.hangul,
      extra: ko.roman,
      tts:   ko.hangul,
    });
  }
  return cards;
}

// ---------- Deck registry ----------

const DECKS = {
  jamoBasic:       { label: "Hangul — basic letters",      build: () => jamoBasic },
  jamoAdvanced:    { label: "Hangul — advanced letters",   build: () => jamoAdvanced },
  syllables:       { label: "Syllable blocks",             build: () => syllables },
  words:           { label: "Common words (200)",          build: () => words },
  phrases:         { label: "Common phrases (200)",        build: () => phrases },
  sinoNumbers:     { label: "Sino-Korean numbers",         build: () => sinoNumbers },
  nativeNumbers:   { label: "Native Korean numbers",       build: () => nativeNumbers },
  arabicSino:      { label: "Arabic → Sino-Korean",        build: () => generateArabicToKorean({ count: 20, min: 1, max: 999, system: "sino" }) },
  arabicNative:    { label: "Arabic → Native Korean",      build: () => generateArabicToKorean({ count: 20, min: 1, max: 99,  system: "native" }) },
};
