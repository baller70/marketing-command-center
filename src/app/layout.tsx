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
