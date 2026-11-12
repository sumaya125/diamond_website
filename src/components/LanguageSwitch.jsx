// A single link to the other language. English lives at "/", Arabic at "/ar".
const OTHER = {
  en: { href: "/ar", lang: "ar", label: "العربية" },
  ar: { href: "/", lang: "en", label: "English" },
};

export default function LanguageSwitch({ locale = "en" }) {
  const other = OTHER[locale] ?? OTHER.en;
  return (
    <a className="lang-switch" href={other.href} hrefLang={other.lang} lang={other.lang}>
      {other.label}
    </a>
  );
}
