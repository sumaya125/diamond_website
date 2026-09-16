"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";

const BG = "#000000";
const INK = "#FFFFFF";

// 0 = أول ما يبان السكشن من تحت، 1 = لما يبان كامل.
// نستهلك المدى كله عشان الظهور يكون أبطأ ما يمكن: كل سطر ياخذ ~45% من
// مسافة السكرول المتاحة، والثاني ما يبدأ إلا بعد ما الأول يخلص.
const LINES = [
  { text: "From wearing a diamond…", from: 0.0, to: 0.46 },
  { text: "to understanding it.", from: 0.52, to: 1.0 },
];

const RISE = 25; // بكسل — حركة خفيفة بس

function Line({ progress, from, to, children }) {
  // useTransform يقصّ القيم خارج المدى تلقائياً، فالسطر يظل ظاهر بعد ما يكمل.
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const y = useTransform(progress, [from, to], [RISE, 0]);

  return (
    <motion.p style={{ opacity, y }} className="block whitespace-nowrap">
      {children}
    </motion.p>
  );
}

export default function Statement() {
  const sectionRef = useRef(null);
  const reduced = useReducedMotion();

  // هذا آخر سكشن بالصفحة، فالصفحة توقف سكرول أول ما ينزل آخر السكشن
  // على آخر الشاشة. يعني "end start" ما توصله أبداً — التقدّم يقف عند ~0.30
  // والسطر الثاني (0.36) ما كان يبدأ نهائياً.
  // "end end" = يخلص أول ما يبان السكشن كامل — وهذا آخر شي نقدر نوصله.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });

  // سبرنق أنعم من الهيرو: يمسح أي قفزة من عجلة الماوس عشان الظهور
  // يطلع متدرّج وهادي بدل ما ينط مع كل نقرة سكرول.
  const progress = useSpring(scrollYProgress, {
    stiffness: 55,
    damping: 26,
    restDelta: 0.0002,
  });

  const type = {
    color: INK,
    fontWeight: 400,
    letterSpacing: "0.02em",
    lineHeight: 1.45,
    fontSize: "clamp(1.35rem, 3.4vw, 3.1rem)",
  };

  return (
    // سكشن انتقالي قصير: الارتفاع = المحتوى + padding، بدون 100vh.
    <section
      ref={sectionRef}
      className="px-6 py-16 md:py-24"
      style={{ backgroundColor: BG }}
    >
      <div className="font-reader text-center" style={type}>
        {LINES.map(({ text, from, to }) =>
          reduced ? (
            // بدون حركة: نفس المكان النهائي، ظاهر على طول
            <p key={text} className="block whitespace-nowrap">
              {text}
            </p>
          ) : (
            <Line key={text} progress={progress} from={from} to={to}>
              {text}
            </Line>
          )
        )}
      </div>
    </section>
  );
}
