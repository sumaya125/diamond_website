"use client";

import { useEffect, useId, useRef, useState } from "react";
import { headlineCopy } from "@/components/SplitHeadline";

/*
 * Sections 2, 3 and 4 as ONE pinned, scroll-driven stage.
 * Ported from docs/prototype.html — frameAt, lensAt, drawZoom, flyLens and
 * render keep the prototype's maths. Everything worth tuning is a constant
 * in the block below; the look lives in globals.css under "Loupe stage".
 */

// ── Assets ──────────────────────────────────────────────────────────────
const ASSETS = {
  frame: (i) => `/frames/necklace/frame_${String(i).padStart(3, "0")}.webp`,
  still: "/images/necklace_still_4k.jpg", // pixel-identical to the last frame
  hand: "/images/hand_cutout.webp",
  appShot: "/images/app_shot_pendant.jpg",
};
const FRAME_COUNT = 54;
const FRAME_RANGES = {
  LIGHT_ON: [0, 19], // black → glimmer → spotlight on
  PUSH_IN: [20, 53], // slow camera push-in
};
const STILL_SIZE = { w: 3840, h: 2160 };

// High-resolution plates, shown only inside the lens and drawn in this order
// (later = on top). x / y / w / h are fractions of the 4K still.
const PLATES = [
  { src: "/images/necHD3.jpeg", x: 0.390625, y: 0.324074, w: 0.21875, h: 0.481481 }, // whole necklace (Carat)
  { src: "/images/necHD1.jpeg", x: 0.440104, y: 0.539352, w: 0.115885, h: 0.217593 }, // pendant (Cut, Clarity)
  { src: "/images/necHD2.jpeg", x: 0.414063, y: 0.421296, w: 0.088542, h: 0.157407 }, // chain (Color)
];
// A plate longer than PLATE_MAX_EDGE gets a PLATE_SMALL_EDGE copy on small
// or low-DPR screens.
const PLATE_MAX_EDGE = 6000;
const PLATE_SMALL_EDGE = 3000;

// ── Scroll map, in viewport heights ─────────────────────────────────────
// Track height = (sum + 1) × 100svh. Changing one number retimes that part.
const SEGMENTS = {
  LIGHT_ON: 1.0, // frames 0 → 19
  PUSH_IN: 1.0, // frames 20 → 53
  TAGLINE: 0.6, // hold the last frame; tagline in over the first third
  HANDOVER: 0.5, // tagline out, 4K still takes over, mobile picture shrinks
  LENS_OPEN: 0.5, // lens grows onto step 1, step copy fades in
  STEPS: 4.0, // the four lens steps, equal shares
  FLY: 1.3, // black → grey, hand slides in, ring flies into the phone
  SETTLE: 0.6, // app screen, headline and store buttons fill in
};
const STEP_HOLD = 0.62; // share of each step spent standing still
// Moments inside FLY, as fractions of it.
const FLY_TIMING = {
  fadeEnd: 0.55, // section 4 in, picture + section 3 copy out
  handEnd: 0.8, // hand has arrived
  ringStart: 0.15, // ring leaves the necklace
  shotStart: 0.7, // pendant image inside the phone fades in
  copyStart: 0.6, // headline + buttons start (they finish at the end of SETTLE)
};
const COPY_START_IN_LENS_OPEN = 0.3; // step copy fades in over the rest of LENS_OPEN

// ── Rendering ───────────────────────────────────────────────────────────
const SMOOTHING = 0.14; // scroll lerp per frame
const SNAP = 0.0004; // stop the loop once this close
const MAX_DPR = 2;
const NARROW_MQ = "(max-width: 800px), (max-aspect-ratio: 1/1)";
const MOBILE_AREA_VH = 60; // picture height after the hand-over, narrow screens
const LENS_RADIUS_SCALE = 1.35; // step.r × min(areaW, areaH) × this
const LENS_HALO_PX = 11; // how far the ring's outer halo reaches
const COPY_LENS_GAP_PX = 24; // desktop: min space between step copy and halo
const COPY_SWAP_MS = 280;

// ── Section 4 geometry ──────────────────────────────────────────────────
const HAND_ASPECT = { w: 2, h: 3 };
// The phone screen inside the hand photo, in % of the photo.
const SCREEN_RECT = { left: 39.5, top: 11.4, width: 35.4, height: 50.1 };
const SCREEN_RADIUS = 11; // % of the screen width
const SCREEN_ROTATE_DEG = -0.25;
// The ring inside the app's image, in % of that image. The flying ring lands here.
const TARGET_RING = { size: 42, x: 50, y: 58 };
// Where the hand starts, as fractions of the viewport (mirrored in RTL).
const HAND_FROM = { x: -0.18, y: 0.35 };

// ── Steps ───────────────────────────────────────────────────────────────
// x / y: lens centre in still coordinates (0–1). z: zoom. r: radius as a
// share of the picture's short side. Copy per locale; add `ar` beside `en`.
const STEPS = [
  {
    key: "cut",
    x: 0.498,
    y: 0.64,
    z: 2.6,
    r: 0.17,
    en: {
      name: "Cut",
      q: "What’s your cut?",
      a: "Cut decides how light travels through the stone. A well cut diamond sends light back as brilliance; a poor one looks glassy, whatever its size.",
    },
    ar: {
      name: "القطع",
      q: "ما جودة قطعك؟",
      a: "القطع يحدد كيف يسري الضوء داخل الحجر. الألماسة المقطوعة جيداً تعيد الضوء بريقاً، والرديئة تبدو كالزجاج مهما كان حجمها.",
    },
  },
  {
    key: "clarity",
    x: 0.498,
    y: 0.685,
    z: 3.4,
    r: 0.15,
    en: {
      name: "Clarity",
      q: "How clear are you?",
      a: "Clarity grades the tiny marks inside the stone. Most are invisible without magnification, so paying for flawless often buys nothing you can see.",
    },
    ar: {
      name: "النقاء",
      q: "ما درجة نقائك؟",
      a: "النقاء يقيس العلامات الدقيقة داخل الحجر. معظمها لا يُرى إلا بالتكبير، فدفع ثمن «الخالي من العيوب» كثيراً ما يشتري شيئاً لن تراه.",
    },
  },
  {
    key: "color",
    x: 0.458,
    y: 0.5,
    z: 3.0,
    r: 0.15,
    en: {
      name: "Color",
      q: "What color are you, really?",
      a: "Color runs from D, completely colorless, to Z, a faint yellow. Set in white metal, a G or H often looks just as white for far less.",
    },
    ar: {
      name: "اللون",
      q: "ما لونك الحقيقي؟",
      a: "يتدرج اللون من D عديم اللون تماماً إلى Z المائل قليلاً إلى الصفرة. في المعدن الأبيض، يبدو G أو H أبيض بالقدر نفسه بسعر أقل بكثير.",
    },
  },
  {
    key: "carat",
    x: 0.498,
    y: 0.615,
    z: 1.7,
    r: 0.2,
    en: {
      name: "Carat",
      q: "How much do you weigh?",
      a: "Carat is weight, not size. A stone just under a round number, 0.9 instead of 1.0, can look almost identical and cost noticeably less.",
    },
    ar: {
      name: "القيراط",
      q: "كم تزن؟",
      a: "القيراط وزن لا حجم. حجر أقل بقليل من الرقم المدوّر، 0.9 بدل 1.0، قد يبدو مطابقاً تقريباً ويكلّف أقل بشكل ملحوظ.",
    },
  },
];

// ── App placeholder data (all numbers are placeholders) ─────────────────
const APP_DATA = {
  reportId: "0417",
  grades: [
    { key: "cut", value: "Excellent" },
    { key: "color", value: "G" },
    { key: "clarity", value: "VS1" },
    { key: "carat", value: "1.02" },
  ],
  priceDeltaPct: 8, // % above similar certified stones
  meterAt: 68, // % along the Fair → High meter
};

// ── Copy ────────────────────────────────────────────────────────────────
// The tagline comes from SplitHeadline (second half of the hero sentence).
const COPY = {
  en: {
    dir: "ltr",
    stageLabel: "From the reveal to four questions to ask a diamond, and the app",
    revealLabel: "The necklace, revealed",
    taglinePrefix: "— ",
    sceneAlt: "A diamond necklace on a black velvet bust under a single spotlight",
    stepsLabel: "Four questions to ask a diamond",
    stepCount: (n, total) => [String(n), ` of ${total}`],
    loading: "Loading",
    app: {
      screenAlt:
        "The app checking a diamond: cut excellent, color G, clarity VS1, 1.02 carats, priced 8% above similar certified stones",
      title: "Stone check",
      report: (id) => `Report ${id}`,
      grades: { cut: "Cut", color: "Color", clarity: "Clarity", carat: "Carat" },
      priceLabel: "Price check",
      price: (pct) => `${pct}% above similar certified stones`,
      meterLow: "Fair",
      meterHigh: "High",
      headline: ["Now you understand it.", "Buy it right."],
      body: "Check any stone before you pay: its grades, its certificate, and what similar diamonds really sell for.",
      stores: [
        { small: "Download on the", name: "App Store", href: "#", label: "Download on the App Store" },
        { small: "Get it on", name: "Google Play", href: "#", label: "Get it on Google Play" },
      ],
    },
  },
  ar: {
    dir: "rtl",
    stageLabel: "من كشف القطعة إلى أربعة أسئلة تطرحها على الألماسة، ثم التطبيق",
    revealLabel: "العقد، مكشوفاً",
    taglinePrefix: "— ",
    sceneAlt: "عقد ألماس على مجسّم مخملي أسود تحت بقعة ضوء واحدة",
    stepsLabel: "أربعة أسئلة تطرحها على الألماسة",
    stepCount: (n, total) => [String(n), ` من ${total}`],
    loading: "جارٍ التحميل",
    app: {
      screenAlt:
        "التطبيق يفحص ألماسة: قطع ممتاز، لون G، نقاء VS1، وزن 1.02 قيراط، وسعرها أعلى بـ8% من أحجار مشابهة معتمدة",
      title: "فحص الحجر",
      report: (id) => `تقرير ${id}`,
      grades: { cut: "القطع", color: "اللون", clarity: "النقاء", carat: "القيراط" },
      priceLabel: "فحص السعر",
      price: (pct) => `أعلى بـ${pct}% من أحجار مشابهة معتمدة`,
      meterLow: "عادل",
      meterHigh: "مرتفع",
      headline: ["الآن فهمتها.", "اشترِها بالشكل الصحيح."],
      body: "افحص أي حجر قبل أن تدفع: درجاته، وشهادته، وبكم تُباع الألماسات المشابهة فعلاً.",
      stores: [
        { small: "حمّله من", name: "App Store", href: "#", label: "حمّله من App Store" },
        { small: "احصل عليه من", name: "Google Play", href: "#", label: "احصل عليه من Google Play" },
      ],
    },
  },
};

// ── Maths ───────────────────────────────────────────────────────────────
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const span = (p, a, b) => clamp((p - a) / (b - a));
const within = ([a, b], t) => lerp(a, b, t);

const TOTAL_VH = Object.values(SEGMENTS).reduce((a, b) => a + b, 0);
// Segment boundaries as [start, end] fractions of the pinned distance.
const BOUNDS = (() => {
  const out = {};
  let acc = 0;
  for (const [k, v] of Object.entries(SEGMENTS)) {
    out[k] = [acc / TOTAL_VH, (acc + v) / TOTAL_VH];
    acc += v;
  }
  return out;
})();

// Cover-fit the still into a W × H area.
function coverFit(W, H) {
  const s = Math.max(W / STILL_SIZE.w, H / STILL_SIZE.h);
  const dw = STILL_SIZE.w * s;
  const dh = STILL_SIZE.h * s;
  return { dw, dh, ox: (W - dw) / 2, oy: (H - dh) / 2 };
}

function frameAt(p) {
  const [a0, a1] = BOUNDS.LIGHT_ON;
  const [b0, b1] = BOUNDS.PUSH_IN;
  const [f0, f1] = FRAME_RANGES.LIGHT_ON;
  const [g0, g1] = FRAME_RANGES.PUSH_IN;
  if (p <= a1) return Math.round(lerp(f0, f1, span(p, a0, a1)));
  return Math.round(lerp(g0, g1, span(p, b0, b1)));
}

function lensAt(p) {
  const [o0, o1] = BOUNDS.LENS_OPEN;
  const [s0, s1] = BOUNDS.STEPS;
  if (p < s0) {
    const t = ease(span(p, o0, o1));
    return { ...STEPS[0], r: STEPS[0].r * t, z: lerp(1, STEPS[0].z, t), idx: 0 };
  }
  const u = span(p, s0, s1) * STEPS.length;
  const i = Math.min(STEPS.length - 1, Math.floor(u));
  const f = u - i;
  if (i === STEPS.length - 1 || f < STEP_HOLD) return { ...STEPS[i], idx: i };
  const t = ease((f - STEP_HOLD) / (1 - STEP_HOLD));
  const A = STEPS[i];
  const B = STEPS[i + 1];
  return {
    x: lerp(A.x, B.x, t),
    y: lerp(A.y, B.y, t),
    z: lerp(A.z, B.z, t),
    r: lerp(A.r, B.r, t),
    idx: t < 0.5 ? i : i + 1,
  };
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Very large plates get a smaller copy on small / low-DPR screens.
async function plateSource(img, src) {
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  const small = window.innerWidth < 800 || (window.devicePixelRatio || 1) < 2;
  if (long <= PLATE_MAX_EDGE || !small) return src;
  const k = PLATE_SMALL_EDGE / long;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.92));
  if (!blob) return src;
  const url = URL.createObjectURL(blob);
  await loadImage(url);
  return url;
}

const localized = (entry, locale) => entry[locale] ?? entry.en;

// ── Section 4 pieces (shared by the animated stage and the static version) ──
function AppScene({ copy, rtl, handRef, targetRef, targetOn }) {
  const app = copy.app;
  const screenAspect =
    (SCREEN_RECT.width * HAND_ASPECT.w) / (SCREEN_RECT.height * HAND_ASPECT.h);
  // The photo is mirrored in RTL, so the screen rectangle is mirrored too.
  const screenStyle = {
    left: `${rtl ? 100 - SCREEN_RECT.left - SCREEN_RECT.width : SCREEN_RECT.left}%`,
    top: `${SCREEN_RECT.top}%`,
    width: `${SCREEN_RECT.width}%`,
    height: `${SCREEN_RECT.height}%`,
    borderRadius: `${SCREEN_RADIUS}% / ${SCREEN_RADIUS * screenAspect}%`,
    transform: `rotate(${rtl ? -SCREEN_ROTATE_DEG : SCREEN_ROTATE_DEG}deg)`,
  };

  return (
    <div
      ref={handRef}
      className="ls-hand"
      style={{ aspectRatio: `${HAND_ASPECT.w} / ${HAND_ASPECT.h}` }}
    >
      <img src={ASSETS.hand} alt="" aria-hidden="true" draggable={false} />
      <div className="ls-screen" role="img" aria-label={app.screenAlt} style={screenStyle}>
        <div className="ls-ui" aria-hidden="true">
          <div className="ls-ui-top ls-ui-fill">
            <span className="ls-ui-title">{app.title}</span>
            <span className="ls-ui-id">{app.report(APP_DATA.reportId)}</span>
          </div>

          <div className="ls-shot">
            <div
              className="ls-shot-img"
              style={{ backgroundImage: `url("${ASSETS.appShot}")` }}
            />
            {/* the flying ring lands exactly here */}
            <div
              ref={targetRef}
              className={`ls-target${targetOn ? " is-on" : ""}`}
              style={{
                left: `${TARGET_RING.x}%`,
                top: `${TARGET_RING.y}%`,
                width: `${TARGET_RING.size}%`,
              }}
            />
          </div>

          <ul className="ls-grades ls-ui-fill">
            {APP_DATA.grades.map((g) => (
              <li key={g.key}>
                <small>{app.grades[g.key]}</small>
                <b>{g.value}</b>
              </li>
            ))}
          </ul>

          <div className="ls-verdict ls-ui-fill">
            <small>{app.priceLabel}</small>
            <p>{app.price(APP_DATA.priceDeltaPct)}</p>
            <div className="ls-meter">
              <i style={{ insetInlineStart: `${APP_DATA.meterAt}%` }} />
            </div>
            <div className="ls-meter-labels">
              <span>{app.meterLow}</span>
              <span>{app.meterHigh}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppCopy({ copy, titleId }) {
  const app = copy.app;
  return (
    <div className="ls-s4-copy">
      <h2 id={titleId}>
        {app.headline.map((line, i) => (
          <span key={i} className="ls-line">
            {line}
            {i < app.headline.length - 1 && " "}
          </span>
        ))}
      </h2>
      <p>{app.body}</p>
      <div className="ls-stores">
        {app.stores.map((s) => (
          // TODO: swap for the official store badges
          <a key={s.name} href={s.href} aria-label={s.label}>
            <small>{s.small}</small>
            <span>{s.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function LoupeStage({ locale = "en" }) {
  const copy = COPY[locale] ?? COPY.en;
  const rtl = copy.dir === "rtl";
  const sentence = headlineCopy(locale).section;
  const tagline = `${copy.taglinePrefix}${sentence.start} ${sentence.end}`;
  const uid = useId();
  const ids = {
    reveal: `${uid}-reveal`,
    app: `${uid}-app`,
    staticApp: `${uid}-static-app`,
  };

  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const canvasRef = useRef(null);
  const zoomRef = useRef(null);
  const plateRefs = useRef([]);
  const ringRef = useRef(null);
  const s4Ref = useRef(null);
  const handRef = useRef(null);
  const targetRef = useRef(null);
  const loadingRef = useRef(null);

  // Only the step copy goes through React; everything else is written
  // straight to the DOM inside the rAF loop.
  const [step, setStep] = useState(0);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const view = viewRef.current;
    const canvas = canvasRef.current;
    const zoom = zoomRef.current;
    const plateEls = plateRefs.current;
    const ring = ringRef.current;
    const s4 = s4Ref.current;
    const hand = handRef.current;
    const lensTarget = targetRef.current;
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dirSign = rtl ? -1 : 1;

    let teardown = null;

    function start() {
      const ctx = canvas.getContext("2d", { alpha: false });
      const narrowMq = window.matchMedia(NARROW_MQ);
      const frames = new Array(FRAME_COUNT).fill(null);
      const blobUrls = [];
      let alive = true;
      let framesLoaded = 0;
      let framesReady = false;
      let stillReady = false;
      let lensReady = false; // still + every plate decoded
      let lastDrawn = -1;
      let lastSize = "";
      let shown = -1;
      let swapTimer = 0;
      let target = 0;
      let current = 0;
      let raf = 0;
      // Stage size, cached on resize so the loop never forces layout for it.
      const geo = { W: 0, H: 0 };

      // ── canvas ───────────────────────────────────────────────────────
      function drawFrame(i, W, H) {
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const w = Math.round(W * dpr);
        const h = Math.round(H * dpr);
        const key = `${w}x${h}`;
        if (key !== lastSize) {
          canvas.width = w;
          canvas.height = h;
          lastSize = key;
          lastDrawn = -1;
        }
        if (i === lastDrawn) return;
        const img = frames[i];
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        if (!img) return; // still loading: stay black
        const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * s;
        const dh = img.naturalHeight * s;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        lastDrawn = i;
      }

      // ── lens ─────────────────────────────────────────────────────────
      // The still and the plates are drawn at their magnified size around
      // the lens centre (no CSS scale, so nothing is rasterised small).
      function drawZoom(fit, cx, cy, z) {
        const zw = fit.dw * z;
        const zh = fit.dh * z;
        const zx = cx + (fit.ox - cx) * z;
        const zy = cy + (fit.oy - cy) * z;
        zoom.style.backgroundSize = `${zw}px ${zh}px`;
        zoom.style.backgroundPosition = `${zx}px ${zy}px`;
        PLATES.forEach((pl, k) => {
          const el = plateEls[k];
          el.style.left = `${zx + pl.x * zw}px`;
          el.style.top = `${zy + pl.y * zh}px`;
          el.style.width = `${pl.w * zw}px`;
          el.style.height = `${pl.h * zh}px`;
        });
      }

      function setTextIndex(i) {
        if (i === shown) return;
        const first = shown === -1;
        shown = i;
        if (first) {
          setStep(i);
          return;
        }
        setSwapping(true);
        clearTimeout(swapTimer);
        swapTimer = window.setTimeout(() => {
          if (!alive) return;
          setStep(i);
          setSwapping(false);
        }, COPY_SWAP_MS);
      }

      // Desktop: keep the step copy clear of every lens position. The copy
      // column is capped at the space left of the leftmost lens edge
      // (right of the rightmost one in RTL). Transitions interpolate x and
      // r linearly with the same t, so the step positions are the extremes.
      function fitCopy() {
        if (narrowMq.matches) {
          stage.style.removeProperty("--ls-copy-room");
          return;
        }
        const fit = coverFit(geo.W, geo.H);
        const unit = Math.min(geo.W, geo.H) * LENS_RADIUS_SCALE;
        let room = Infinity;
        for (const st of STEPS) {
          const cx = fit.ox + st.x * fit.dw;
          const r = st.r * unit;
          room = Math.min(room, rtl ? geo.W - (cx + r) : cx - r);
        }
        room -= LENS_HALO_PX + COPY_LENS_GAP_PX;
        stage.style.setProperty("--ls-copy-room", `${Math.max(0, room)}px`);
      }

      // ── section 4: the lens flies into the phone ─────────────────────
      // (lx, ly, lr) is where the loupe sits on the necklace right now.
      function flyLens(p, lx, ly, lr) {
        const [f0, f1] = BOUNDS.FLY;
        const [g0, g1] = BOUNDS.SETTLE;
        const fly = span(p, f0, f1);
        const bg = ease(span(p, f0, within(BOUNDS.FLY, FLY_TIMING.fadeEnd)));
        const handIn = ease(span(p, f0, within(BOUNDS.FLY, FLY_TIMING.handEnd)));
        const move = ease(span(p, within(BOUNDS.FLY, FLY_TIMING.ringStart), f1));
        const settle = ease(span(p, g0, g1));

        stage.style.setProperty("--ls-s4-o", bg);
        s4.classList.toggle("is-live", bg >= 1);
        view.style.opacity = 1 - bg;
        stage.style.setProperty("--ls-copy-mult", 1 - bg);
        // hand first: the target is measured after it has moved
        hand.style.setProperty(
          "--ls-hx",
          `${(1 - handIn) * HAND_FROM.x * dirSign * geo.W}px`
        );
        hand.style.setProperty("--ls-hy", `${(1 - handIn) * HAND_FROM.y * geo.H}px`);

        let x = lx;
        let y = ly;
        let r = lr;
        if (move > 0) {
          // Target measured live, relative to the stage, so the ring chases
          // it while the hand is still sliding. Its rect centre is
          // unaffected by the screen's slight rotation; the radius comes
          // from the layout width, which the rotation doesn't inflate.
          const sr = stage.getBoundingClientRect();
          const tr = lensTarget.getBoundingClientRect();
          const tx = tr.left - sr.left + tr.width / 2;
          const ty = tr.top - sr.top + tr.height / 2;
          const trad = parseFloat(getComputedStyle(lensTarget).width) / 2;
          x = lerp(lx, tx, move);
          y = lerp(ly, ty, move);
          r = lerp(lr, trad, move);
        }
        ring.style.left = `${x}px`;
        ring.style.top = `${y}px`;
        ring.style.width = ring.style.height = `${2 * r}px`;
        ring.classList.toggle("is-flying", fly > 0 && fly < 1);

        // landed: the ring drawn inside the screen takes over
        const arrived = fly >= 1;
        ring.style.visibility = arrived ? "hidden" : "visible";
        lensTarget.classList.toggle("is-on", arrived);

        stage.style.setProperty(
          "--ls-shot-o",
          ease(span(p, within(BOUNDS.FLY, FLY_TIMING.shotStart), f1))
        );
        stage.style.setProperty("--ls-ui-o", settle);
        stage.style.setProperty(
          "--ls-s4c-o",
          ease(span(p, within(BOUNDS.FLY, FLY_TIMING.copyStart), g1))
        );
      }

      // ── one progress value drives everything ─────────────────────────
      function render(p) {
        const narrow = narrowMq.matches;

        // picture area: narrow screens ease from 100svh to MOBILE_AREA_VH
        const handover = ease(span(p, ...BOUNDS.HANDOVER));
        const areaVh = narrow ? lerp(100, MOBILE_AREA_VH, handover) : 100;
        view.style.setProperty("--ls-vh", `${areaVh}svh`);
        const aW = geo.W;
        const aH = (geo.H * areaVh) / 100;

        // section 2: frames, until the still takes over
        const stillOn = stillReady && p >= BOUNDS.HANDOVER[0];
        stage.style.setProperty("--ls-still-o", stillOn ? 1 : 0);
        const canvasOn = !stillOn || handover < 1;
        canvas.style.visibility = canvasOn ? "visible" : "hidden";
        if (canvasOn) drawFrame(framesReady ? frameAt(p) : 0, aW, aH);

        // tagline: in over the first third of TAGLINE, out across HANDOVER
        const [t0, t1] = BOUNDS.TAGLINE;
        const tagIn = ease(span(p, t0, t0 + (t1 - t0) / 3));
        stage.style.setProperty("--ls-tag-o", tagIn * (1 - handover));

        // section 3: lens + copy (never before the still and plates decode)
        const lensOn = lensReady && p > BOUNDS.LENS_OPEN[0];
        stage.style.setProperty("--ls-lens-o", lensOn ? 1 : 0);
        stage.style.setProperty(
          "--ls-copy-o",
          lensOn
            ? ease(span(p, within(BOUNDS.LENS_OPEN, COPY_START_IN_LENS_OPEN), BOUNDS.LENS_OPEN[1]))
            : 0
        );

        const st = lensAt(p);
        const fit = coverFit(aW, aH);
        const cx = fit.ox + st.x * fit.dw;
        const cy = fit.oy + st.y * fit.dh;
        const r = st.r * Math.min(aW, aH) * LENS_RADIUS_SCALE;
        view.style.setProperty("--ls-x", `${cx}px`);
        view.style.setProperty("--ls-y", `${cy}px`);
        view.style.setProperty("--ls-r", `${r}px`);
        if (lensOn) {
          drawZoom(fit, cx, cy, st.z);
          zoom.style.clipPath = `circle(${r}px at ${cx}px ${cy}px)`;
        }
        setTextIndex(st.idx);

        // section 4
        flyLens(p, cx, cy, r);
      }

      // ── scroll ───────────────────────────────────────────────────────
      function progress() {
        const rect = track.getBoundingClientRect();
        const distance = track.offsetHeight - stage.clientHeight;
        return distance > 0 ? clamp(-rect.top / distance) : 0;
      }

      function tick() {
        current += (target - current) * SMOOTHING;
        if (Math.abs(target - current) < SNAP) current = target;
        render(current);
        raf = current !== target ? requestAnimationFrame(tick) : 0;
      }

      function onScroll() {
        target = progress();
        if (!raf) raf = requestAnimationFrame(tick);
      }

      function measure() {
        geo.W = stage.clientWidth;
        geo.H = stage.clientHeight;
        fitCopy();
      }

      // Geometry changed: recompute and jump straight to the new position.
      function onResize() {
        measure();
        lastDrawn = -1;
        target = current = progress();
        render(current);
      }

      // ── load ─────────────────────────────────────────────────────────
      // Frame 0 first so it can be drawn right away; scrubbing waits for all.
      loadImage(ASSETS.frame(0)).then((img0) => {
        if (!alive) return;
        frames[0] = img0;
        framesLoaded++;
        lastDrawn = -1;
        render(current);
        for (let i = 1; i < FRAME_COUNT; i++) {
          loadImage(ASSETS.frame(i)).then((img) => {
            if (!alive) return;
            frames[i] = img;
            if (++framesLoaded < FRAME_COUNT) return;
            framesReady = true;
            if (loadingRef.current) loadingRef.current.style.opacity = 0;
            lastDrawn = -1;
            render(current);
          });
        }
      });

      loadImage(ASSETS.still).then((img) => {
        if (!alive) return;
        stillReady = !!img;
        render(current);
      });

      Promise.all([
        loadImage(ASSETS.still),
        ...PLATES.map((pl) =>
          loadImage(pl.src).then((img) => (img ? plateSource(img, pl.src) : null))
        ),
      ]).then(([still, ...plateSrcs]) => {
        if (!alive) return;
        plateSrcs.forEach((src, k) => {
          if (!src || src === PLATES[k].src) return;
          blobUrls.push(src);
          plateEls[k].style.backgroundImage = `url("${src}")`;
        });
        lensReady = !!still && plateSrcs.every(Boolean);
        render(current);
      });

      // Section 4 art, decoded long before the fly-in.
      loadImage(ASSETS.hand);
      loadImage(ASSETS.appShot);

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      narrowMq.addEventListener("change", onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(stage);
      ro.observe(track);

      measure();
      target = current = progress();
      render(current);

      return () => {
        alive = false;
        cancelAnimationFrame(raf);
        clearTimeout(swapTimer);
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        narrowMq.removeEventListener("change", onResize);
        blobUrls.forEach((u) => URL.revokeObjectURL(u));
      };
    }

    function sync() {
      teardown?.();
      teardown = reducedMq.matches ? null : start();
    }

    sync();
    reducedMq.addEventListener("change", sync);
    return () => {
      reducedMq.removeEventListener("change", sync);
      teardown?.();
    };
  }, [rtl]);

  const stepCopy = localized(STEPS[step], locale);
  const [countNow, countRest] = copy.stepCount(step + 1, STEPS.length);
  const swapClass = `ls-swap${swapping ? " is-out" : ""}`;

  return (
    <>
      <section
        ref={trackRef}
        className="ls-track"
        aria-label={copy.stageLabel}
        lang={locale}
        dir={copy.dir}
        style={{ height: `${(TOTAL_VH + 1) * 100}svh` }}
      >
        <div ref={stageRef} className="ls-stage">
          {/* ── section 2 (+ the picture the lens works on) ── */}
          <div className="ls-part" role="group" aria-labelledby={ids.reveal}>
            <div ref={viewRef} className="ls-view">
              <canvas ref={canvasRef} aria-hidden="true" />
              <div
                className="ls-layer ls-still"
                aria-hidden="true"
                style={{ backgroundImage: `url("${ASSETS.still}")` }}
              />
              <div className="ls-dim" aria-hidden="true" />
              <div
                ref={zoomRef}
                className="ls-layer ls-zoom"
                aria-hidden="true"
                style={{ backgroundImage: `url("${ASSETS.still}")` }}
              >
                {PLATES.map((pl, k) => (
                  <div
                    key={pl.src}
                    ref={(el) => {
                      plateRefs.current[k] = el;
                    }}
                    className="ls-plate"
                    style={{ backgroundImage: `url("${pl.src}")` }}
                  />
                ))}
              </div>
              <div className="ls-fade" aria-hidden="true" />
            </div>
            <p id={ids.reveal} className="ls-tagline">
              {tagline}
            </p>
          </div>

          {/* ── section 3: the loupe steps ── */}
          <div className="ls-part" role="group" aria-label={copy.stepsLabel}>
            <div className="ls-copy" aria-live="polite">
              <p className={`ls-count ${swapClass}`}>
                <b>{countNow}</b>
                {countRest}
              </p>
              <h3 className={`ls-q ${swapClass}`}>{stepCopy.q}</h3>
              <p className={`ls-a ${swapClass}`}>{stepCopy.a}</p>
            </div>
            <ol className="ls-rail" aria-hidden="true">
              {STEPS.map((s, i) => (
                <li key={s.key} className={i === step ? "is-on" : undefined}>
                  {localized(s, locale).name}
                </li>
              ))}
            </ol>
          </div>

          {/* ── section 4: the app ── */}
          <div ref={s4Ref} className="ls-s4" role="region" aria-labelledby={ids.app}>
            <AppScene copy={copy} rtl={rtl} handRef={handRef} targetRef={targetRef} />
            <AppCopy copy={copy} titleId={ids.app} />
          </div>

          {/* the lens ring: follows the loupe, then flies into the phone */}
          <div ref={ringRef} className="ls-ring" aria-hidden="true" />

          <p ref={loadingRef} className="ls-loading" aria-hidden="true">
            {copy.loading}
          </p>
        </div>
      </section>

      {/* prefers-reduced-motion: same content, no pinning or scrubbing */}
      <section className="ls-static" aria-label={copy.stageLabel} lang={locale} dir={copy.dir}>
        <div
          className="ls-static-pic"
          role="img"
          aria-label={copy.sceneAlt}
          style={{ backgroundImage: `url("${ASSETS.still}")` }}
        />
        <p className="ls-static-tag">{tagline}</p>
        <ol className="ls-static-steps" aria-label={copy.stepsLabel}>
          {STEPS.map((s) => {
            const c = localized(s, locale);
            return (
              <li key={s.key}>
                <h3>{c.q}</h3>
                <p>{c.a}</p>
              </li>
            );
          })}
        </ol>
        <div
          className="ls-s4 ls-s4--static is-live"
          role="region"
          aria-labelledby={ids.staticApp}
        >
          <AppScene copy={copy} rtl={rtl} targetOn />
          <AppCopy copy={copy} titleId={ids.staticApp} />
        </div>
      </section>
    </>
  );
}
