"use client";

import { motion } from "motion/react";

// ── Copy ────────────────────────────────────────────────────────────────
// One sentence split across the two sections. `full` is what screen readers
// get, as one sentence; the four visual phrases are aria-hidden.
// For Arabic: fill in `ar` and pass locale="ar" — the layout itself is
// written with logical properties, so RTL flips on its own.
export const HEADLINE = {
  en: {
    dir: "ltr",
    full: "From wearing a diamond to understanding it.",
    hero: { start: "From wearing", end: "a diamond" },
    section: { start: "to understanding", end: "it." },
  },
  ar: {
    dir: "rtl",
    full: "من ارتداء الألماس… إلى فهمه.",
    hero: { start: "من ارتداء", end: "الألماس" },
    section: { start: "إلى", end: "فهمه." },
  },
};

// ── Motion ──────────────────────────────────────────────────────────────
// The phrases are "written" on: a clip wipe that runs from the start edge
// to the end edge (left → right in English, right → left in Arabic).
// The second phrase waits for the first one to finish.
export const WIPE_S = 0.9; // how long one phrase takes to write
export const WIPE_GAP_S = 0.12; // pause between the two phrases
export const PHRASE_STAGGER_S = WIPE_S + WIPE_GAP_S;
const PHRASE_RISE = 10; // px it lifts as it writes
const WIPE_EASE = [0.33, 1, 0.68, 1]; // steady, like a pen stroke

export const wipeHidden = (rtl) =>
  rtl ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
export const WIPE_SHOWN = "inset(0% 0% 0% 0%)";

export function headlineCopy(locale = "en") {
  const copy = HEADLINE[locale];
  return copy?.full ? copy : HEADLINE.en;
}

// Instance variables: which vertical position and which ink this copy uses.
// Everything else lives in globals.css under `.hl`.
function vars(part) {
  return part === "hero"
    ? {
        "--hl-y": "var(--hl-y-hero)",
        "--hl-y-mobile": "var(--hl-y-hero-mobile)",
        "--hl-ink": "var(--hl-ink-hero)",
      }
    : {
        "--hl-y": "var(--hl-y-section)",
        "--hl-y-mobile": "var(--hl-y-section-mobile)",
        "--hl-ink": "var(--hl-ink-section)",
      };
}

/**
 * Animated split headline (hero + the video section).
 *
 * `show`       — false keeps both phrases hidden, true fades them in.
 * `innerStyle` — motion values from the host's own scroll logic (the hero
 *                passes its scroll-driven fade and drift here).
 * `instant`    — reduced motion: no fade, no drift, just visible.
 */
export default function SplitHeadline({
  part,
  locale = "en",
  layout = "split", // "split" = على جنبَي الموضوع، "center" = سطر واحد تحت
  show = true,
  instant = false,
  innerStyle,
}) {
  const copy = headlineCopy(locale);
  const { start, end } = copy[part];
  const hidden = wipeHidden(copy.dir === "rtl");

  // Reduced motion gets the finished state with no wipe at all.
  const phrase = (delay) => ({
    initial: { clipPath: hidden, opacity: 0, y: PHRASE_RISE },
    animate: show
      ? { clipPath: WIPE_SHOWN, opacity: 1, y: 0 }
      : { clipPath: instant ? WIPE_SHOWN : hidden, opacity: instant ? 1 : 0, y: instant ? 0 : PHRASE_RISE },
    transition: {
      clipPath: { duration: instant ? 0 : WIPE_S, delay: instant ? 0 : delay, ease: WIPE_EASE },
      // the fade leads the wipe slightly, so letters don't pop in bare
      opacity: { duration: instant ? 0 : 0.25, delay: instant ? 0 : delay },
      y: { duration: instant ? 0 : WIPE_S, delay: instant ? 0 : delay, ease: WIPE_EASE },
    },
  });

  return (
    <div
      className={`hl ${layout === "center" ? "hl--center" : ""}`}
      style={vars(part)}
      aria-hidden="true"
    >
      <motion.div className="hl__inner" style={innerStyle}>
        {/* the inner span hugs the text, so the wipe starts at the first
            letter instead of at the edge of the column */}
        {layout === "center" ? (
          <span className="hl__line">
            <motion.span className="hl__ink" {...phrase(0)}>
              {`${start} ${end}`}
            </motion.span>
          </span>
        ) : (
          <>
            <span className="hl__side hl__side--start">
              <motion.span className="hl__ink" {...phrase(0)}>
                {start}
              </motion.span>
            </span>
            <span className="hl__side hl__side--end">
              <motion.span className="hl__ink" {...phrase(PHRASE_STAGGER_S)}>
                {end}
              </motion.span>
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Same markup without any animation of its own, for hosts that drive the
 * fade imperatively (the scroll-scrubbed canvas section writes opacity and
 * transform straight onto `innerRef` every frame).
 */
export function SplitHeadlineStatic({
  part,
  locale = "en",
  layout = "split",
  innerRef,
  innerClassName = "",
}) {
  const { start, end } = headlineCopy(locale)[part];

  return (
    <div
      className={`hl ${layout === "center" ? "hl--center" : ""}`}
      style={vars(part)}
      aria-hidden="true"
    >
      <div className={`hl__inner ${innerClassName}`} ref={innerRef}>
        {layout === "center" ? (
          <span className="hl__line">
            <span className="hl__ink">{`${start} ${end}`}</span>
          </span>
        ) : (
          <>
            <span className="hl__side hl__side--start">
              <span className="hl__ink">{start}</span>
            </span>
            <span className="hl__side hl__side--end">
              <span className="hl__ink">{end}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
