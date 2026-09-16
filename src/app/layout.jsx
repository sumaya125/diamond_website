import { Buda, Cormorant_Unicase, Newsreader } from "next/font/google";
import "./globals.css";

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

export const metadata = {
  title: "Maison — Fine Jewellery",
  description: "Luxury jewellery, in motion.",
};

export default function RootLayout({ children }) {
  // No wrapper element around {children}: the hero's sticky stage needs an
  // ancestor chain free of transform / filter / overflow-hidden.
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${newsreader.variable} ${buda.variable}`}
    >
      <body className="bg-backdrop antialiased">{children}</body>
    </html>
  );
}
