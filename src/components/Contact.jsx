"use client";

// ── Copy ────────────────────────────────────────────────────────────────
// One entry per locale, so an Arabic (RTL) version is just another key.
// Real contact: Dr. Ammar Al-Kafaji. Add WhatsApp/Instagram only once he gives real ones.
const CONTACT = {
  en: {
    dir: "ltr",
    label: "Contact",
    heading: "Still not sure? Talk to us.",
    body: "Send us the stone, the certificate, or the quote you were given. A gemologist answers within one business day.",
    methods: [
      {
        label: "Email",
        value: "ammar.alkafaji@gmail.com",
        href: "mailto:ammar.alkafaji@gmail.com",
      },
    ],
    note: "Sunday to Thursday, 10:00 – 18:00 Baghdad time",
  },
  ar: {
    dir: "rtl",
    label: "تواصل معنا",
    heading: "ما زلت متردداً؟ تحدّث إلينا.",
    body: "أرسل لنا الحجر أو الشهادة أو عرض السعر الذي وصلك، ويرد عليك خبير أحجار كريمة خلال يوم عمل واحد.",
    methods: [
      {
        label: "البريد الإلكتروني",
        value: "ammar.alkafaji@gmail.com",
        href: "mailto:ammar.alkafaji@gmail.com",
      },
    ],
    note: "من الأحد إلى الخميس، 10:00 – 18:00 بتوقيت بغداد",
  },
};

export default function Contact({ locale = "en" }) {
  const copy = CONTACT[locale]?.heading ? CONTACT[locale] : CONTACT.en;

  return (
    <section
      className="ct"
      aria-labelledby="contact-heading"
      lang={locale}
      dir={copy.dir}
    >
      <div className="ct-inner">
        <p className="ct-label">{copy.label}</p>
        <h2 id="contact-heading" className="ct-heading">
          {copy.heading}
        </h2>
        <p className="ct-body">{copy.body}</p>

        <ul className="ct-grid">
          {copy.methods.map((m) => (
            <li key={m.label}>
              <small>{m.label}</small>
              <a href={m.href} dir="ltr">
                {m.value}
              </a>
            </li>
          ))}
        </ul>

        <p className="ct-note">{copy.note}</p>
      </div>
    </section>
  );
}
