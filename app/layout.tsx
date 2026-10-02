import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "Rondo · Find a game tonight",
  description: "Find pickup football and futsal near you, pay in two taps, and run tournaments.",
  keywords: ["football", "futsal", "pickup", "Manila", "tournaments", "sports", "community"],
  applicationName: "Rondo",
  appleWebApp: { capable: true, title: "Rondo", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Rondo · Find a game tonight",
    description: "Pickup football and futsal in Metro Manila. Join in a tap, pay from your wallet, run the bracket.",
    siteName: "Rondo",
    images: [{ url: "/scenes/night-pitch.jpg", width: 1440, height: 810, alt: "Floodlit pitch at night" }],
    locale: "en_PH",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/rondo-mark-on-dark.png", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets the safe-area insets used by headers and action bars take effect.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171512" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${barlowCondensed.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="overflow-x-hidden font-body bg-[var(--bg-page)] text-[var(--ink-hi)] antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
