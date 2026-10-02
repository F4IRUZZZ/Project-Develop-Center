import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Develop Center",
  description: "Satu dashboard untuk melihat, mengelola, dan mengarahkan AI agent di proyek GitHub.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/shell/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable} dark antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pdc-tema")||"gelap";var gelap=t==="gelap"||(t==="sistem"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",gelap);document.documentElement.classList.toggle("light",!gelap);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
