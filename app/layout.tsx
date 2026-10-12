import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "Bizly — ניהול עסק",
  description: "ניהול הכנסות, הוצאות ומיסוי לעצמאים בישראל",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${heebo.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
