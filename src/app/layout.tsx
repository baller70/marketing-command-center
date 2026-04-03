import type { Metadata } from "next";
import { Saira, Russo_One } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Providers from "@/components/Providers";
import ThemeProvider from "@/components/ThemeProvider";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${saira.variable} ${russoOne.variable} font-saira antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('kc-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light')}}catch(e){}})()` }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(document.getElementById("kc-back"))return;var b=document.createElement("a");b.id="kc-back";b.href=location.hostname==="localhost"||location.hostname==="127.0.0.1"?"http://localhost:3100":"https://kevinclaw.89-167-33-236.sslip.io";b.style.cssText="position:fixed;top:12px;left:12px;z-index:9999;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;border:1px solid var(--border,#374151);background:var(--bg-card,#1f2937);color:var(--text-secondary,#9ca3af);font-size:12px;font-weight:500;text-decoration:none;font-family:system-ui,sans-serif;transition:color 0.15s ease,border-color 0.15s ease;opacity:1";b.innerHTML="\u2190 KevinClaw";b.onmouseenter=function(){b.style.color="var(--text-primary,#f3f4f6)";b.style.borderColor="var(--border-hover,#4b5563)"};b.onmouseleave=function(){b.style.color="var(--text-secondary,#9ca3af)";b.style.borderColor="var(--border,#374151)"};document.body.appendChild(b)})()` }} />
        <ThemeProvider>
          <Providers>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
