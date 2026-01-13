import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import MainContent from "./components/MainContent";
import AdminAccountSetup from "./components/AdminAccountSetup";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rooster App - Planning voor Horeca",
  description: "Planning en rooster beheer voor horeca medewerkers en managers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rooster App",
  },
  icons: {
    icon: "/logo_200x200.png",
    apple: "/logo_200x200.png",
  },
  themeColor: "#2563eb",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <AdminAccountSetup />
        <Navigation />
        <MainContent>
          {children}
        </MainContent>
      </body>
    </html>
  );
}
