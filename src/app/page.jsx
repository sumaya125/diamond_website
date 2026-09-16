import Hero from "@/components/Hero";
import LoupeStage from "@/components/LoupeStage"; // sections 2 + 3 + 4, one pinned stage
import Contact from "@/components/Contact";
// import Statement from "@/components/Statement";

export default function Page() {
  // <Hero> and <LoupeStage> each own ONE sticky stage. They must stay direct
  // children of <body>: no wrapper may grow a transform, filter, or
  // overflow-hidden, or position: sticky silently stops working.
  //
  // <Statement /> is parked until there's a section below it.
  return (
    <>
      <Hero />
      <LoupeStage />
      <Contact />
      {/* <Statement /> */}
    </>
  );
}
