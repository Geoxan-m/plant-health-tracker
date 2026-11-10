import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plant Health Tracker",
  description: "Track plant symptoms, watering, and observations with a clear health dashboard.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
