import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EAR//RUN",
  description: "Melodic speedrunning — ear training against the clock.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="wrap">
          <header>
            <div className="brand">
              EAR<span>{"//"}</span>RUN
              <small>MELODIC SPEEDRUNNING</small>
            </div>
            <nav>
              <Link href="/">Songs</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/profile">Profile</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
