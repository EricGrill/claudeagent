import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/error-boundary";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hippo Bitcoin ATM - Find Bitcoin ATMs in Pennsylvania",
  description: "Hippo Kiosk is the #1 provider of Bitcoin ATMs in Pennsylvania. Find Bitcoin ATM locations in Lehigh Valley, Berks, Lancaster, Reading, and nearby counties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Header />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
