import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Rondo — Find your next matchday",
  description: "Open the map, join nearby football, and turn pickup games into real matchdays.",
  keywords: ["sports", "games", "football", "soccer", "local", "community"],
  icons: {
    icon: [{ url: "/rondo-logo.png", type: "image/png" }],
    apple: "/rondo-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAF7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${manrope.variable}`}>
      <body className="overflow-x-hidden font-body bg-[var(--bg-page)] text-[var(--ink-hi)] antialiased">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
