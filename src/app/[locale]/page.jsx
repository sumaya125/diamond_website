import Hero from "@/components/Hero";
import LoupeStage from "@/components/LoupeStage"; // sections 2 + 3 + 4, one pinned stage
import Contact from "@/components/Contact";
import LanguageSwitch from "@/components/LanguageSwitch";
// import Statement from "@/components/Statement";

export default async function Page({ params }) {
  const { locale } = await params;

  // <Hero> and <LoupeStage> each own ONE sticky stage. They must stay direct
  // children of <body>: no wrapper may grow a transform, filter, or
  // overflow-hidden, or position: sticky silently stops working.
  //
  // <Statement /> is parked until there's a section below it.
  return (
    <>
      <LanguageSwitch locale={locale} />
      <Hero locale={locale} />
      <LoupeStage locale={locale} />
      <Contact locale={locale} />
      {/* <Statement /> */}
    </>
  );
}
