import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import MainContent from "./components/MainContent";
import UserProvider from "./components/UserProvider";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import { getCurrentUser } from "@/lib/supabase/server";

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
    statusBarStyle: "black-translucent",
    title: "Rooster App",
  },
  icons: {
    icon: "/logo_200x200.png",
    apple: "/logo_200x200.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // De sessie wordt hier server-side uit de cookies gelezen, zodat de app al
  // bij de eerste render weet wie er is ingelogd.
  const user = await getCurrentUser();

  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <UserProvider initialUser={user}>
          <Navigation />
          <MainContent>
            {children}
          </MainContent>
        </UserProvider>
      </body>
    </html>
  );
}
