import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "santrimedia",
  description: "Sistem Manajemen Multimedia Ponpes Annur 2",
};

import { AuthProvider } from '@/providers/AuthProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased min-h-screen bg-slate-50 dark:bg-slate-950`}
      >
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-100 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-900"></div>
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}