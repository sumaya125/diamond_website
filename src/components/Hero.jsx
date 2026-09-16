"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import SplitHeadline, { headlineCopy } from "@/components/SplitHeadline";
import useReducedMotionSafe from "@/components/useReducedMotionSafe";

const FRAMES = 49;
const BG_LIGHT = "#A8A7A1";
const BG_DARK = "#000000";

// صورة العقد + الليبلات + النص تحته — موقوفة مؤقتاً، الهيرو فيديو بس.
// خلّيها true عشان ترجع (ترجع معها التسويد والطول 450vh).
const SHOW_NECKLACE = false;

// ── الخط الزمني، كله من سكرول واحد على سكشن واحد ──────────────────
// بدون العقد: الفريمات تاخذ السكشن كامل، والطول = شاشة ثابتة + نفس مسافة
// السكرول القديمة للفريمات (0.65 × 350vh ≈ 230vh)، فالسرعة ما تتغير.
// أول ما يخلص الفيديو يفك التثبيت ويكمل سكرول عادي للسكشن اللي بعده.
const SCRUB_END = SHOW_NECKLACE ? 0.65 : 1; // فريمات الهيرو: 0 → SCRUB_END
const SECTION_HEIGHT = SHOW_NECKLACE ? "450vh" : "330vh";
const CROSSFADE = [0.6, 0.75]; // الكانفس يطفى والخلفية تسوّد
// الكلمات تطلع مع الفيديو وتفضل ظاهرة، وتختفي بالآخر قبل ما ينتهي السكشن.
const WORDS_FADE = SHOW_NECKLACE ? [0.47, 0.57] : [0.9, 1];
const NECK_TEXT = [0.955, 0.995]; // النص تحت العقد، بعد ما يستقر

// نزول العقد 0.68 → 0.85 مع تباطؤ (ease-out) عبر نقاط وسطية.
const NECK_IN = [0.68, 0.7225, 0.765, 0.8075, 0.85];
const NECK_Y = ["-45vh", "-19vh", "-5.6vh", "-0.7vh", "0vh"];

const pad = (i) => String(i + 1).padStart(3, "0");

// أول نص الجملة ("From wearing | a diamond") جاي من SplitHeadline —
// المواضع والأحجام والألوان كلها متغيّرات CSS في globals.css.
// وهو يطلع مع تحميل الصفحة، ويختفي ويطلع لفوق شوي مع WORDS_FADE.
const HEADLINE_DRIFT = -26; // بكسل — يطفو لفوق وهو يختفي

// ── الليبلات حول القطعة ────────────────────────────────────────────
// تبدأ بعد ما يستقر العقد (0.85)، وترجع تختفي لو رجع المستخدم فوق.
// كل ليبل له نافذة سكرول خاصة فيه: مع كل سكرول يطلع واحد لفوق ويبان،
// والخط ينرسم معه، ثم النقطة. مربوط بالسكرول مو بالوقت.
const ANNO_RISE = 18; // بكسل — يطلع لفوق وهو يبان

// الإحداثيات = نسبة مئوية من المسرح (viewBox 0 0 100 100).
// الترتيب هنا هو ترتيب الظهور: يسار-أعلى، يمين-أعلى، يسار-أسفل، يمين-أسفل.
// السفليان أنزل وأبعد للبرّا، زي الريفرنس.
const ANNOTATIONS = [
  {
    word: "Light",
    from: 0.84,
    to: 0.872,
    dotFrom: 0.872,
    dotTo: 0.886,
    note: "BRINGS IT TO LIFE",
    side: "left",
    edge: "12%",
    top: "14%",
    path: "M 23 16.5 Q 30.3 11.8 36 11.5",
    dotX: "36%",
    dotY: "11.5%",
  },
  {
    word: "Form",
    from: 0.868,
    to: 0.9,
    dotFrom: 0.9,
    dotTo: 0.914,
    note: "GIVES IT SHAPE",
    side: "right",
    edge: "12%",
    top: "12%",
    path: "M 77 14.5 Q 70.5 10.5 64 11.5",
    dotX: "64%",
    dotY: "11.5%",
  },
  {
    word: "Rarity",
    from: 0.896,
    to: 0.928,
    dotFrom: 0.928,
    dotTo: 0.942,
    note: "MAKES IT SPECIAL",
    side: "left",
    edge: "9%",
    top: "33%",
    path: "M 19.5 35.5 Q 31 34 42 24",
    dotX: "42%",
    dotY: "24%",
  },
  {
    word: "Character",
    from: 0.924,
    to: 0.956,
    dotFrom: 0.956,
    dotTo: 0.97,
    note: "MAKES IT YOURS",
    side: "right",
    edge: "9%",
    top: "37%",
    path: "M 81 39 Q 67.5 46 54 45",
    dotX: "54%",
    dotY: "45%",
  },
];

function LabelText({ word, note, align = "left" }) {
  return (
    <>
      <div
        className="font-display italic leading-none"
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "20px",
          textAlign: align,
        }}
      >
        {word}
      </div>
      <div
        className="font-display mt-2 leading-none"
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "10px",
          letterSpacing: "0.15em",
          textAlign: align,
        }}
      >
        {note}
      </div>
    </>
  );
}

// الخط ينرسم من جهة الليبل باتجاه القطعة (بداية الـ path عند الليبل).
function Connector({ progress, item, still }) {
  const draw = useTransform(progress, [item.from, item.to], [0, 1]);
  const o = useTransform(progress, [item.from, item.from + 0.004], [0, 1]);

  return (
    <motion.path
      d={item.path}
      fill="none"
      stroke="rgba(255,255,255,0.28)"
      strokeWidth="0.75"
      vectorEffect="non-scaling-stroke"
      style={{
        pathLength: still ? 1 : draw,
        opacity: still ? 1 : o,
      }}
    />
  );
}

// الليبل + نقطته. الاثنين مطلقين بالنسبة للمسرح، فنرجعهم كـ fragment.
function Annotation({ progress, item, still }) {
  const o = useTransform(progress, [item.from, item.to], [0, 1]);
  const y = useTransform(progress, [item.from, item.to], [ANNO_RISE, 0]);
  const dotO = useTransform(progress, [item.dotFrom, item.dotTo], [0, 1]);

  return (
    <>
      <motion.div
        className="absolute"
        style={{
          [item.side]: item.edge,
          top: item.top,
          opacity: still ? 1 : o,
          y: still ? 0 : y,
        }}
      >
        <LabelText word={item.word} note={item.note} align={item.side} />
      </motion.div>

      {/* النقطة HTML مو <circle>: مع preserveAspectRatio="none" تنبعج بيضاوي */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: item.dotX,
          top: item.dotY,
          width: 4,
          height: 4,
          marginLeft: -2,
          marginTop: -2,
          backgroundColor: "rgba(255,255,255,0.6)",
          opacity: still ? 1 : dotO,
        }}
      />
    </>
  );
}

function MobileAnnotation({ progress, item, still }) {
  const o = useTransform(progress, [item.from, item.to], [0, 1]);
  const y = useTransform(progress, [item.from, item.to], [ANNO_RISE, 0]);

  return (
    <motion.div
      className="mb-4 last:mb-0"
      style={{ opacity: still ? 1 : o, y: still ? 0 : y }}
    >
      <LabelText word={item.word} note={item.note} align="center" />
    </motion.div>
  );
}

/**
 * سكشن واحد يحمل القصة كاملة: الموديل تنزّل راسها، العقد يطيح من الإطار،
 * الخلفية تسوّد، ثم العقد ينزل من فوق ويستقر. مسرح sticky واحد — ما فيه
 * حدود بين بلوكين عشان ما يبان خط فاصل.
 */
export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [ready, setReady] = useState(false);
  // NOT motion's useReducedMotion: that one differs between the server and
  // the first client render, which React reports as a hydration mismatch.
  const reduced = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // الفريمات تنتهي عند 0.65، فنعيد تحجيم التقدّم لهذا المدى بدل 0–1 كامل.
  const scrub = useTransform(p, [0, SCRUB_END], [0, 1]);

  // التسويد والانطفاء بس مع العقد؛ بدونه الهيرو يطلع من الشاشة زي ما هو.
  const bg = useTransform(p, CROSSFADE, SHOW_NECKLACE ? [BG_LIGHT, BG_DARK] : [BG_LIGHT, BG_LIGHT]);
  const canvasFade = useTransform(p, CROSSFADE, SHOW_NECKLACE ? [1, 0] : [1, 1]);
  const wordsFade = useTransform(p, WORDS_FADE, [1, 0]);
  const wordsDrift = useTransform(p, WORDS_FADE, [0, HEADLINE_DRIFT]);

  const neckY = useTransform(p, NECK_IN, NECK_Y);
  const neckFade = useTransform(p, [0.68, 0.85], [0, 1]);
  const textFade = useTransform(p, NECK_TEXT, [0, 1]);


  useEffect(() => {
    // الجوال ياخذ النسخة الخفيفة
    const dir = window.matchMedia("(max-width: 768px)").matches
      ? "/frames-mobile"
      : "/frames";

    let alive = true;
    let loaded = 0;

    imagesRef.current = Array.from({ length: FRAMES }, (_, i) => {
      const img = new window.Image();
      img.src = `${dir}/${pad(i)}.webp`;
      img.onload = () => {
        if (alive && ++loaded === FRAMES) setReady(true);
      };
      return img;
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) draw(scrub.get());
  }, [ready]);

  function draw(v) {
    const i = Math.min(FRAMES - 1, Math.max(0, Math.round(v * (FRAMES - 1))));
    const img = imagesRef.current[i];
    const cv = canvasRef.current;
    if (!img?.complete || !cv) return;

    if (cv.width !== img.naturalWidth) {
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
    }
    cv.getContext("2d").drawImage(img, 0, 0);
  }

  useMotionValueEvent(scrub, "change", (v) => {
    if (ready) draw(v);
  });

  return (
    <section ref={sectionRef} className="relative" style={{ height: SECTION_HEIGHT }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 1 — الخلفية: طبقة واحدة تغطي الشاشة طول الوقت */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundColor: reduced ? (SHOW_NECKLACE ? BG_DARK : BG_LIGHT) : bg,
          }}
        />

        {/* 2 — كانفس الهيرو */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: canvasFade }}
        >
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
        </motion.div>

        {/* نص الهيرو: نصف الجملة الأول، على جنبَي الموديل.
            الجملة كاملة تنقرأ من <h1> المخفي تحت. */}
        <h1 className="sr-only">{headlineCopy().full}</h1>
        <SplitHeadline
          part="hero"
          instant={reduced}
          innerStyle={
            reduced ? undefined : { opacity: wordsFade, y: wordsDrift }
          }
        />

        {SHOW_NECKLACE && (
        <>
        {/* 3 — العقد: الغلاف الخارجي يسوّي التوسيط، والداخلي ياخذ النزول
            عشان ما يتصادم transform التوسيط مع transform الحركة. */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            style={{ y: reduced ? 0 : neckY, opacity: neckFade }}
            className="relative"
          >
            {/* الوهج قبل الصورة بالـ DOM ⇒ يترسم تحتها بدون z-index */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full"
              style={{
                left: "49%",
                top: "84%",
                width: "70vh",
                height: "70vh",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, #E8E4DC 0%, rgba(232,228,220,0.28) 38%, rgba(232,228,220,0) 70%)",
                filter: "blur(120px)",
                opacity: 0.4,
              }}
            />

            <img
              src="/necklace.webp"
              alt="Pear-cut diamond solitaire necklace in platinum"
              draggable={false}
              className="relative block h-[62vh] w-auto select-none"
            />

            {/* الانعكاس: الماسك على الحاوية مو على الصورة المقلوبة، وإلا
                راح يتلاشى لفوق باتجاه القطعة بدل ما ينزل. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-full left-0 w-full"
              style={{
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 42%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 42%)",
              }}
            >
              <img
                src="/necklace.webp"
                alt=""
                draggable={false}
                className="block h-[62vh] w-auto select-none"
                style={{
                  transform: "scaleY(-1)",
                  opacity: 0.18,
                  filter: "blur(8px)",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* 4 — الليبلات: خطوط + مواضع مطلقة على الديسكتوب فقط.
            تحت 1024px الخطوط تقطع القطعة، فنشيلها ونكدّس الليبلات. */}
        <svg
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {ANNOTATIONS.map((a) => (
            <Connector key={a.word} progress={p} item={a} still={reduced} />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {ANNOTATIONS.map((a) => (
            <Annotation key={a.word} progress={p} item={a} still={reduced} />
          ))}
        </div>

        {/* تحت 1024px: قائمة مكدّسة بالنص، بدون خطوط */}
        <div className="pointer-events-none absolute inset-x-0 top-[64%] px-6 lg:hidden">
          {ANNOTATIONS.map((a) => (
            <MobileAnnotation
              key={a.word}
              progress={p}
              item={a}
              still={reduced}
            />
          ))}
        </div>

        {/* 5 — النص، بعد ما يستقر العقد */}
        <motion.div
          className="absolute inset-x-0 bottom-[7%] px-6 text-center"
          style={{ opacity: textFade }}
        >
          <p
            className="font-display leading-tight"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "clamp(1.15rem, 2.2vw, 2.1rem)",
              letterSpacing: "0.06em",
            }}
          >
            From wearing a diamond…
          </p>
          <p
            className="font-display leading-tight"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "clamp(1.15rem, 2.2vw, 2.1rem)",
              letterSpacing: "0.06em",
            }}
          >
            to understanding it.
          </p>
          <p
            className="font-display mt-5 leading-none"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "clamp(0.56rem, 0.72vw, 0.74rem)",
              letterSpacing: "0.24em",
            }}
          >
            THE PEAR SOLITAIRE
          </p>
        </motion.div>
        </>
        )}
      </div>
    </section>
  );
}
