import { notFound } from "next/navigation";
import { Buda, Cormorant_Unicase, Newsreader, Noto_Kufi_Arabic } from "next/font/google";
import "../globals.css";

const cormorant = Cormorant_Unicase({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

// Buda ships a single weight (300) — that's the look in the reference.
const buda = Buda({
  subsets: ["latin"],
  weight: "300",
  variable: "--font-buda",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-newsreader",
  display: "swap",
});

// Buda has no Arabic glyphs; a light Kufi keeps the same thin stroke.
const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400"],
  variable: "--font-kufi",
  display: "swap",
});

// English lives at "/", Arabic at "/ar" (see next.config.mjs).
const LOCALES = ["en", "ar"];

const METADATA = {
  en: {
    title: "Saghchi — Iraqi diamond & gold prices",
    description: "Live diamond, gold and silver prices for Iraq, with a jeweller you can book.",
  },
  ar: {
    title: "صاغچي — أسعار الألماس والذهب في العراق",
    description: "أسعار الألماس والذهب والفضة في العراق لحظة بلحظة، مع خبير تحجز موعدك وياه.",
  },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return METADATA[locale] ?? METADATA.en;
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound();

  // No wrapper element around {children}: the hero's sticky stage needs an
  // ancestor chain free of transform / filter / overflow-hidden.
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cormorant.variable} ${newsreader.variable} ${buda.variable} ${kufi.variable}`}
    >
      <body className="bg-backdrop antialiased">{children}</body>
    </html>
  );
}
