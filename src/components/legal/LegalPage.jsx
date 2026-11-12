// Plain, readable legal/support page shared by /privacy and /support.
export default function LegalPage({ dir, title, updated, sections, back }) {
  return (
    <main dir={dir} className="mx-auto max-w-2xl px-6 py-20 text-ink" style={{ lineHeight: 1.8 }}>
      <a href={back.href} className="text-sm opacity-70 underline">{back.label}</a>
      <h1 className="mt-8 text-4xl" style={{ fontFamily: "var(--font-cormorant), var(--font-kufi)" }}>{title}</h1>
      <p className="mt-2 text-sm opacity-60">{updated}</p>
      {sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="text-xl font-medium">{s.h}</h2>
          {s.p.map((t, i) => (
            <p key={i} className="mt-3 opacity-85" dangerouslySetInnerHTML={{ __html: t }} />
          ))}
        </section>
      ))}
    </main>
  );
}
