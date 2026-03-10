import type { Metadata } from "next";
import { Saira, Russo_One } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Providers from "@/components/Providers";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
});

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo-one",
});

export const metadata: Metadata = {
  title: "Marketing Engine V2 — Autonomous Pipeline",
  description: "Multi-Brand Campaign Machine — Assembly Line Architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${saira.variable} ${russoOne.variable} font-saira antialiased bg-slate-50 text-slate-900`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=location.hostname;var b=(h==="localhost"||h==="127.0.0.1")?"http://"+h+":3006":"https://kevins-mac-mini.tailc5323b.ts.net:3006";var s=document.createElement("script");s.src=b+"/nav.js";s.defer=true;document.body.appendChild(s)})();`,
          }}
        />
      </body>
    </html>
  );
}
