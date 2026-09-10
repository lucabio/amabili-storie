import { Figtree, Fredoka } from "next/font/google";

import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Amabili Storie",
  description:
    "Storie personalizzate che risolvono i capricci dei bambini, notte dopo notte.",
};

export default function RootLayout({ children }) {
  return (
    // data-scroll-behavior: since Next 16 smooth scroll is no longer forced by the framework.
    <html lang="it" data-scroll-behavior="smooth" className={`${fredoka.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
