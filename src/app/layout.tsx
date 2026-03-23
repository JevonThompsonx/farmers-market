import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env["NEXTAUTH_URL"] ?? "http://localhost:3000",
  ),
  title: {
    default: "Farmers Market",
    template: "%s | Farmers Market",
  },
  description:
    "Discover fresh, local produce from farms near you. Browse products, connect with farmers, and support your local food community.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Farmers Market",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
