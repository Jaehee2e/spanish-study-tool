import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Check, X, ChevronRight, ChevronLeft, RotateCcw, Flame, BookOpen,
  PlayCircle, Layers, GraduationCap,
} from "lucide-react";

/* =========================================================
   커리큘럼: 4단계 학습 트리
   Nivel 1 완전 기초 → Nivel 2 초급 → Nivel 3 중급 → Nivel 4 심화
   (여러 초급 교재의 공통적인 문법 진도 순서를 참고해 자체 작성한 콘텐츠)
========================================================= */

const LEVELS = [
  { key: "n1", label: "Nivel 1 · 완전 기초", desc: "글자와 단어의 뼈대" },
  { key: "n2", label: "Nivel 2 · 초급", desc: "현재시제로 문장 만들기" },
  { key: "n3", label: "Nivel 3 · 중급", desc: "대명사와 과거시제" },
  { key: "n4", label: "Nivel 4 · 심화", desc: "미래·명령·접속법" },
];

// UNITS 데이터는 파일 크기 때문에 별도 파일에서 import하는 것이 좋습니다.
// 여기서는 간단한 구조로 시작합니다.
const UNITS = [
  {
    id: "alfabeto", level: "n1",
    title: "알파벳과 발음",
    subtitle: "El alfabeto — 보이는 대로 읽는 언어",
    explanation:
      "스페인어는 거의 철자 그대로 발음해요. 주의할 것만 외우면 돼요: h는 항상 묵음, ñ는 '니' 소리, ll은 '야/자' 소리, j는 강한 'ㅎ', c는 e/i 앞에서 'ㅆ(스페인)/ㅅ', qu는 'ㄲ' 소리예요.",
    table: {
      headers: ["철자", "발음", "예시"],
      rows: [
        ["h", "묵음", "hola → '올라'"],
        ["ñ", "니", "España → '에스빠냐'"],
        ["ll", "야 / 자", "llamar → '야마르'"],
        ["j", "강한 ㅎ", "Japón → '하뽄'"],
        ["c + e/i", "ㅆ/ㅅ", "cine → '씨네'"],
        ["qu", "ㄲ", "queso → '께소'"],
      ],
    },
    examples: [
      { es: "hola", ko: "'올라' — h는 소리 나지 않아요" },
      { es: "mañana", ko: "'마냐나' — ñ는 '니' 소리" },
      { es: "tortilla", ko: "'또르띠야' — ll은 '야'" },
      { es: "cerveza", ko: "'쎄르베싸' — c+e는 'ㅆ'" },
    ],
    quiz: [
      { id: "al1", prompt: "'hola'에서 h는 어떻게 발음할까요?", options: ["묵음 (소리 없음)", "'ㅎ' 소리"], answer: "묵음 (소리 없음)" },
      { id: "al2", prompt: "'España'의 ñ 발음은?", options: ["니", "은"], answer: "니" },
      { id: "al3", prompt: "'queso'의 qu 발음은?", options: ["ㄲ", "쿠"], answer: "ㄲ" },
      { id: "al4", prompt: "'tortilla'의 ll 발음은?", options: ["야", "엘엘"], answer: "야" },
      { id: "al5", prompt: "'Japón'의 j 발음은?", options: ["강한 ㅎ", "ㅈ"], answer: "강한 ㅎ" },
    ],
  },
];

const PASS_THRESHOLD = 0.8;

/* =========================================================
   단어장 데이터
========================================================= */

const VOCAB_CATEGORIES = [
  { key: "saludos", label: "인사와 기본 표현" },
  { key: "familia", label: "가족" },
  { key: "comida", label: "음식" },
  { key: "colores", label: "색깔" },
  { key: "lugares", label: "장소" },
  { key: "emociones", label: "감정" },
];

const ALL_VOCAB = [
  { id: "v01", category: "saludos", es: "hola", ko: "안녕", example: { es: "¡Hola! ¿Qué tal?", ko: "안녕! 잘 지내?" } },
  { id: "v02", category: "saludos", es: "adiós", ko: "안녕 (헤어질 때)", example: { es: "Adiós, hasta mañana.", ko: "안녕, 내일 봐." } },
  { id: "v03", category: "saludos", es: "buenos días", ko: "좋은 아침이에요", example: { es: "Buenos días, ¿cómo estás?", ko: "좋은 아침이에요, 어떻게 지내요?" } },
  { id: "v04", category: "saludos", es: "por favor", ko: "부탁해요", example: { es: "Un café, por favor.", ko: "커피 한 잔 부탁해요." } },
  { id: "v05", category: "saludos", es: "gracias", ko: "고마워요", example: { es: "Muchas gracias por todo.", ko: "모든 것에 정말 고마워요." } },
  { id: "v06", category: "familia", es: "madre", ko: "어머니", example: { es: "Mi madre cocina muy bien.", ko: "우리 엄마는 요리를 정말 잘해요." } },
  { id: "v07", category: "familia", es: "padre", ko: "아버지", example: { es: "Mi padre trabaja mucho.", ko: "우리 아빠는 일을 많이 해요." } },
  { id: "v08", category: "comida", es: "agua", ko: "물", example: { es: "Necesito un vaso de agua.", ko: "물 한 잔이 필요해요." } },
  { id: "v09", category: "comida", es: "pan", ko: "빵", example: { es: "Compro pan cada mañana.", ko: "나는 매일 아침 빵을 사요." } },
  { id: "v10", category: "colores", es: "rojo", ko: "빨간색", example: { es: "El coche es rojo.", ko: "그 차는 빨간색이에요." } },
];

/* =========================================================
   보조 함수 & 컴포넌트
========================================================= */

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildVocabQuestions(words, count) {
  const picked = shuffle(words).slice(0, count);
  return picked.map((w) => {
    const distractorPool = ALL_VOCAB.filter((x) => x.id !== w.id && x.ko !== w.ko);
    const distractors = shuffle(distractorPool).slice(0, 3).map((x) => x.ko);
    const options = shuffle([w.ko, ...distractors]);
    return { id: w.id, unitId: "vocab", prompt: `"${w.es}"의 뜻은?`, options, answer: w.ko };
  });
}

function TileBorder() {
  return (
    <div
      className="h-2 w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #2E5C8A 0, #2E5C8A 6px, #C15B3C 6px, #C15B3C 12px, #F6F1E7 12px, #F6F1E7 18px)",
      }}
    />
  );
}

function MediaNote({ media }) {
  if (!media) return null;
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="ficha flex items-start gap-3 rounded-xl border border-[#E4DBC9] bg-[#FBF8F1] p-3.5"
    >
      <PlayCircle size={22} className="text-[#C15B3C] mt-0.5 shrink-0" />
      <div>
        <div className="text-sm font-semibold" style={{ color: "#1F3A57" }}>{media.label}</div>
        <div className="text-xs text-[#6B6255] mt-0.5">{media.note}</div>
      </div>
    </a>
  );
}

/* =========================================================
   메인 앱
========================================================= */

export default function SpanishStudyTool() {
  const [view, setView] = useState("menu");
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [progress, setProgress] = useState({});
  const [wrongQueue, setWrongQueue] = useState([]);

  const [activeCategory, setActiveCategory] = useState(null);
  const [flipped, setFlipped] = useState({});

  const [quizContext, setQuizContext] = useState(null);
  const [quizQueue, setQuizQueue] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState([]);

  const stackRef = useRef([{ view: "menu", unitId: null, category: null }]);
  const poppingRef = useRef(false);

  const applyScreen = useCallback((s) => {
    if (s.unitId !== undefined) setActiveUnitId(s.unitId);
    if (s.category !== undefined) setActiveCategory(s.category);
    setView(s.view);
  }, []);

  const pushScreen = useCallback((screen) => {
    stackRef.current.push(screen);
    try {
      window.history.pushState({ app: "cuaderno", depth: stackRef.current.length }, "");
    } catch (e) { }
    applyScreen(screen);
  }, [applyScreen]);

  const replaceScreen = useCallback((screen) => {
    stackRef.current[stackRef.current.length - 1] = screen;
    applyScreen(screen);
  }, [applyScreen]);

  const goBack = useCallback(() => {
    if (stackRef.current.length <= 1) return;
    let handled = false;
    try {
      if (window.history.state?.app === "cuaderno") {
        poppingRef.current = true;
        window.history.back();
        handled = true;
      }
    } catch (e) { }
    if (!handled) {
      stackRef.current.pop();
      applyScreen(stackRef.current[stackRef.current.length - 1]);
    }
  }, [applyScreen]);

  useEffect(() => {
    try {
      window.history.replaceState({ app: "cuaderno", depth: 1 }, "");
    } catch (e) { }
    const onPop = () => {
      poppingRef.current = false;
      if (stackRef.current.length > 1) {
        stackRef.current.pop();
        applyScreen(stackRef.current[stackRef.current.length - 1]);
        if (stackRef.current.length === 1) {
          try {
            window.history.pushState({ app: "cuaderno", depth: 1 }, "");
          } catch (e) { }
        }
      } else {
        try {
          window.history.pushState({ app: "cuaderno", depth: 1 }, "");
        } catch (e) { }
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [applyScreen]);

  const activeUnit = useMemo(() => UNITS.find((u) => u.id === activeUnitId) || null, [activeUnitId]);

  function resetQuizState() {
    setQIndex(0);
    setSelected(null);
    setShowFeedback(false);
    setSessionCorrect(0);
    setSessionWrong([]);
  }

  function startUnit(unit) {
    pushScreen({ view: "unit", unitId: unit.id });
  }

  function startQuiz(unit) {
    setQuizContext({ type: "unit", title: unit.title, unit });
    setQuizQueue(unit.quiz.map((q) => ({ ...q, unitId: unit.id })));
    resetQuizState();
    pushScreen({ view: "quiz" });
  }

  function startVocabQuiz(scope) {
    const pool = scope === "all" ? ALL_VOCAB : ALL_VOCAB.filter((w) => w.category === scope);
    const qs = buildVocabQuestions(pool, Math.min(10, pool.length));
    const label = scope === "all" ? "전체 단어 테스트" : (VOCAB_CATEGORIES.find((c) => c.key === scope)?.label || "") + " 테스트";
    setQuizContext({ type: "vocab", title: label, scope });
    setQuizQueue(qs);
    resetQuizState();
    pushScreen({ view: "quiz" });
  }

  function answer(option) {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    const q = quizQueue[qIndex];
    const correct = option === q.answer;
    const isVocab = q.unitId === "vocab";
    if (correct) {
      setSessionCorrect((c) => c + 1);
    } else {
      setSessionWrong((w) => [
        ...w,
        isVocab ? { kind: "vocab", id: q.id } : { kind: "unit", unitId: q.unitId, id: q.id },
      ]);
    }
  }

  function nextQuestion() {
    if (qIndex + 1 < quizQueue.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      const score = sessionCorrect / quizQueue.length;
      if (quizContext?.type === "unit") {
        const unitId = quizContext.unit.id;
        setProgress((p) => ({
          ...p,
          [unitId]: {
            completed: score >= PASS_THRESHOLD || p[unitId]?.completed || false,
            bestScore: Math.max(p[unitId]?.bestScore || 0, score),
          },
        }));
      }
      replaceScreen({ view: "result" });
    }
  }

  function retryQuiz() {
    if (!quizContext) return;
    if (quizContext.type === "unit") {
      const unit = quizContext.unit;
      setQuizQueue(unit.quiz.map((q) => ({ ...q, unitId: unit.id })));
    } else if (quizContext.type === "vocab") {
      const scope = quizContext.scope;
      const pool = scope === "all" ? ALL_VOCAB : ALL_VOCAB.filter((w) => w.category === scope);
      setQuizQueue(buildVocabQuestions(pool, Math.min(10, pool.length)));
    }
    resetQuizState();
    replaceScreen({ view: "quiz" });
  }

  const totalCompleted = UNITS.filter((u) => progress[u.id]?.completed).length;
  const inGrammar = ["menu", "unit"].includes(view) || (["quiz", "result"].includes(view) && quizContext?.type === "unit");
  const inVocab = ["vocab-menu", "vocab-cards"].includes(view) || (["quiz", "result"].includes(view) && quizContext?.type !== "unit");

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#F6F1E7", fontFamily: "'Inter', system-ui, sans-serif", color: "#2B2A28" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .ficha { box-shadow: 0 1px 0 #E4DBC9, 0 8px 20px -12px rgba(43,42,40,0.35); }
      `}</style>

      <TileBorder />

      <div className="max-w-md mx-auto px-5 pt-6 pb-16">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "#1F3A57" }}>
              Cuaderno Español
            </h1>
            <p className="text-sm text-[#6B6255]">기초부터 심화까지, 단계별 스페인어</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#C15B3C]">
            <Flame size={18} />
            <span className="text-sm font-semibold">{totalCompleted}/{UNITS.length}</span>
          </div>
        </div>

        {/* 섹션 탭 */}
        <div className="flex gap-2 mb-4 bg-[#EDE7DA] rounded-full p-1">
          <button
            onClick={() => { if (view !== "menu") pushScreen({ view: "menu", unitId: null, category: null }); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
              inGrammar ? "bg-white text-[#1F3A57] shadow-sm" : "text-[#8A8072]"
            }`}
          >
            <GraduationCap size={16} /> 문법
          </button>
          <button
            onClick={() => { if (view !== "vocab-menu") pushScreen({ view: "vocab-menu", unitId: null, category: null }); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${
              inVocab ? "bg-white text-[#1F3A57] shadow-sm" : "text-[#8A8072]"
            }`}
          >
            <Layers size={16} /> 단어장
          </button>
        </div>

        {/* 뒤로가기 바 */}
        {view !== "menu" && view !== "vocab-menu" && (
          <button
            onClick={goBack}
            className="ficha w-full mb-5 flex items-center gap-2 rounded-xl border border-[#E4DBC9] bg-white px-4 py-3 font-semibold"
            style={{ color: "#1F3A57" }}
          >
            <ChevronLeft size={20} className="text-[#C15B3C]" />
            이전 화면으로 돌아가기
          </button>
        )}

        {/* 메뉴 화면 */}
        {view === "menu" && (
          <div className="space-y-6">
            {LEVELS.map((lv) => {
              const levelUnits = UNITS.filter((u) => u.level === lv.key);
              const doneCount = levelUnits.filter((u) => progress[u.id]?.completed).length;
              return (
                <div key={lv.key}>
                  <div className="flex items-end justify-between mb-2 px-1">
                    <div>
                      <div className="font-display text-lg font-semibold" style={{ color: "#1F3A57" }}>
                        {lv.label}
                      </div>
                      <div className="text-xs text-[#8A8072]">{lv.desc}</div>
                    </div>
                    <div className="text-xs font-semibold text-[#C15B3C]">
                      {doneCount}/{levelUnits.length}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {levelUnits.map((u) => {
                      const p = progress[u.id];
                      return (
                        <button
                          key={u.id}
                          onClick={() => startUnit(u)}
                          className="ficha w-full text-left rounded-xl border border-[#E4DBC9] bg-white p-3.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="pr-2">
                              <div className="font-semibold text-[15px]" style={{ color: "#1F3A57" }}>
                                {u.title}
                              </div>
                              <div className="text-xs text-[#6B6255] mt-0.5">{u.subtitle}</div>
                            </div>
                            {p?.completed ? (
                              <div className="h-6 w-6 shrink-0 rounded-full bg-[#4C7A3D] flex items-center justify-center">
                                <Check size={14} color="white" />
                              </div>
                            ) : (
                              <ChevronRight size={18} className="text-[#8A8072] shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 유닛 상세 */}
        {view === "unit" && activeUnit && (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-[#C15B3C] mb-1">
                {LEVELS.find((l) => l.key === activeUnit.level)?.label}
              </div>
              <h2 className="font-display text-2xl font-semibold" style={{ color: "#1F3A57" }}>
                {activeUnit.title}
              </h2>
              <p className="text-sm text-[#6B6255] mt-1">{activeUnit.subtitle}</p>
            </div>

            <div className="rounded-xl bg-white border border-[#E4DBC9] p-4">
              <div className="flex items-center gap-2 mb-2 text-[#C15B3C]">
                <BookOpen size={16} />
                <span className="text-xs uppercase tracking-wider font-semibold">설명</span>
              </div>
              <p className="text-sm leading-relaxed">{activeUnit.explanation}</p>
            </div>

            <div className="rounded-xl bg-white border border-[#E4DBC9] p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {activeUnit.table.headers.map((h, i) => (
                      <th key={i} className="text-left pb-2 text-[#8A8072] font-medium text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeUnit.table.rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-[#EEE7D8]">
                      {row.map((cell, ci) => (
                        <td key={ci} className="py-2 pr-3 align-top">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#8A8072] px-1">예문</span>
              {activeUnit.examples.map((ex, i) => (
                <div key={i} className="rounded-lg bg-[#FBF8F1] border border-[#EEE7D8] p-3">
                  <div className="font-medium" style={{ color: "#1F3A57" }}>{ex.es}</div>
                  <div className="text-sm text-[#6B6255] mt-1">{ex.ko}</div>
                </div>
              ))}
            </div>

            {activeUnit.media && <MediaNote media={activeUnit.media} />}

            <button
              onClick={() => startQuiz(activeUnit)}
              className="w-full rounded-xl py-3.5 font-semibold text-white"
              style={{ background: "#C15B3C" }}
            >
              퀴즈 풀기 (80% 이상 = 완료 체크)
            </button>
          </div>
        )}

        {/* 단어장 메뉴 */}
        {view === "vocab-menu" && (
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-wider text-[#8A8072] px-1">
              카테고리 선택 (총 {ALL_VOCAB.length}단어)
            </span>
            {VOCAB_CATEGORIES.map((c) => {
              const words = ALL_VOCAB.filter((w) => w.category === c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => { setFlipped({}); pushScreen({ view: "vocab-cards", category: c.key }); }}
                  className="ficha w-full text-left rounded-xl border border-[#E4DBC9] bg-white p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-display text-lg font-semibold" style={{ color: "#1F3A57" }}>{c.label}</div>
                    <div className="text-sm text-[#6B6255] mt-0.5">단어 {words.length}개</div>
                  </div>
                  <ChevronRight size={20} className="text-[#8A8072]" />
                </button>
              );
            })}

            <button
              onClick={() => startVocabQuiz("all")}
              className="w-full rounded-xl py-3.5 font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: "#2E5C8A" }}
            >
              <GraduationCap size={18} /> 전체 단어 테스트 (10문항)
            </button>
          </div>
        )}

        {/* 플래시���드 */}
        {view === "vocab-cards" && activeCategory && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold" style={{ color: "#1F3A57" }}>
              {VOCAB_CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </h2>
            <p className="text-xs text-[#8A8072] px-1">카드를 탭하면 뜻과 예문이 보여요</p>

            <div className="space-y-3">
              {ALL_VOCAB.filter((w) => w.category === activeCategory).map((w) => {
                const isOpen = !!flipped[w.id];
                return (
                  <button
                    key={w.id}
                    onClick={() => setFlipped((f) => ({ ...f, [w.id]: !f[w.id] }))}
                    className={`ficha w-full text-left rounded-xl border p-4 transition-colors ${
                      isOpen ? "border-[#2E5C8A] bg-[#F0F4F8]" : "border-[#E4DBC9] bg-white"
                    }`}
                  >
                    {!isOpen ? (
                      <div className="font-display text-xl font-semibold" style={{ color: "#1F3A57" }}>
                        {w.es}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-lg font-semibold" style={{ color: "#1F3A57" }}>{w.es}</span>
                          <span className="font-semibold text-[#C15B3C]">{w.ko}</span>
                        </div>
                        <div className="text-sm mt-2">{w.example.es}</div>
                        <div className="text-xs text-[#6B6255] mt-0.5">{w.example.ko}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => startVocabQuiz(activeCategory)}
              className="w-full rounded-xl py-3.5 font-semibold text-white"
              style={{ background: "#C15B3C" }}
            >
              이 카테고리 단어 테스트
            </button>
          </div>
        )}

        {/* 퀴즈 */}
        {view === "quiz" && quizQueue.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8A8072]">
                {quizContext?.title} · {qIndex + 1} / {quizQueue.length}
              </span>
              <div className="h-1.5 w-24 rounded-full bg-[#EDE7DA] overflow-hidden">
                <div
                  className="h-full bg-[#2E5C8A]"
                  style={{ width: `${((qIndex + (showFeedback ? 1 : 0)) / quizQueue.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="ficha rounded-2xl bg-white border border-[#E4DBC9] p-6">
              <div className="text-xs uppercase tracking-wider text-[#8A8072] mb-3">
                {quizQueue[qIndex].unitId === "vocab" ? "단어 뜻 맞히기" : "정답을 고르세요"}
              </div>
              <div className="font-display text-xl leading-relaxed" style={{ color: "#1F3A57" }}>
                {quizQueue[qIndex].prompt}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {quizQueue[qIndex].options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrect = opt === quizQueue[qIndex].answer;
                let style = "bg-white border-[#E4DBC9]";
                if (showFeedback && isCorrect) style = "bg-[#E7F0E2] border-[#4C7A3D]";
                else if (showFeedback && isSelected && !isCorrect) style = "bg-[#F5E4E2] border-[#A63D40]";
                return (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    disabled={showFeedback}
                    className={`rounded-xl border p-3.5 text-left font-medium flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {showFeedback && isCorrect && <Check size={18} className="text-[#4C7A3D]" />}
                    {showFeedback && isSelected && !isCorrect && <X size={18} className="text-[#A63D40]" />}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <button
                onClick={nextQuestion}
                className="w-full rounded-xl py-3.5 font-semibold text-white"
                style={{ background: "#2E5C8A" }}
              >
                {qIndex + 1 < quizQueue.length ? "다음 문항" : "결과 보기"}
              </button>
            )}
          </div>
        )}

        {/* 결과 */}
        {view === "result" && (
          <ResultView
            score={sessionCorrect / quizQueue.length}
            total={quizQueue.length}
            correct={sessionCorrect}
            title={quizContext?.title}
            onRetry={retryQuiz}
            onMenu={goBack}
          />
        )}
      </div>

      <TileBorder />
    </div>
  );
}

function ResultView({ score, total, correct, title, onRetry, onMenu }) {
  const passed = score >= PASS_THRESHOLD;
  return (
    <div className="space-y-5 text-center pt-6">
      <div
        className="mx-auto h-20 w-20 rounded-full flex items-center justify-center"
        style={{ background: passed ? "#E7F0E2" : "#F5E4E2" }}
      >
        {passed ? <Check size={36} className="text-[#4C7A3D]" /> : <X size={36} className="text-[#A63D40]" />}
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: "#1F3A57" }}>
          {passed ? "완료!" : "조금만 더 연습해요"}
        </h2>
        <p className="text-xs text-[#8A8072]">{title}</p>
        <p className="text-sm text-[#6B6255] mt-1">
          {correct} / {total} 정답 · {Math.round(score * 100)}%
        </p>
      </div>
      <div className="space-y-2.5 pt-2">
        {!passed && (
          <button
            onClick={onRetry}
            className="w-full rounded-xl py-3.5 font-semibold text-white"
            style={{ background: "#C15B3C" }}
          >
            다시 도전하기
          </button>
        )}
        <button
          onClick={onMenu}
          className="w-full rounded-xl py-3.5 font-semibold border border-[#E4DBC9]"
          style={{ color: "#1F3A57" }}
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
