import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VISC — Market Intelligence Platform",
  description: "VISC — Visionary Intelligence & Strategic Capital. Professional market intelligence and decision support platform.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#12151A",
              color: "#F4F5F7",
              border: "1px solid #232833",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            },
            success: {
              iconTheme: { primary: "#1ECB8C", secondary: "#12151A" },
            },
            error: {
              iconTheme: { primary: "#F0455A", secondary: "#12151A" },
            },
          }}
        />
      </body>
    </html>
  );
}
