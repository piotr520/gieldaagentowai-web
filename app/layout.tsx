import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXTAUTH_URL ?? "https://gieldaagentowai.pl";

export const metadata: Metadata = {
  title: {
    default: "Giełda Agentów AI – Marketplace agentów AI",
    template: "%s | Giełda Agentów AI",
  },
  description:
    "Przeglądaj, uruchamiaj i kupuj agentów AI stworzonych przez ekspertów. Twórcy mogą wystawiać własnych agentów i zarabiać.",
  metadataBase: new URL(baseUrl),
  openGraph: {
    siteName: "Giełda Agentów AI",
    type: "website",
    locale: "pl_PL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} antialiased`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
