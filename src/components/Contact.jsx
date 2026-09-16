"use client";

// ── Copy ────────────────────────────────────────────────────────────────
// One entry per locale, so an Arabic (RTL) version is just another key.
// TODO: swap the placeholder address, number and handle for the real ones.
const CONTACT = {
  en: {
    dir: "ltr",
    label: "Contact",
    heading: "Still not sure? Talk to us.",
    body: "Send us the stone, the certificate, or the quote you were given. A gemologist answers within one business day.",
    methods: [
      {
        label: "Email",
        value: "hello@maison.example",
        href: "mailto:hello@maison.example",
      },
      {
        label: "WhatsApp",
        value: "+971 00 000 0000",
        href: "https://wa.me/97100000000",
      },
      {
        label: "Instagram",
        value: "@maison",
        href: "https://instagram.com/maison",
      },
    ],
    note: "Sunday to Thursday, 10:00 – 18:00 GST",
  },
  ar: {
    dir: "rtl",
    label: "", // TODO: النسخة العربية
    heading: "",
    body: "",
    methods: [],
    note: "",
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
              <a href={m.href}>{m.value}</a>
            </li>
          ))}
        </ul>

        <p className="ct-note">{copy.note}</p>
      </div>
    </section>
  );
}
