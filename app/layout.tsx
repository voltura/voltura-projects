import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voltura Projects — Apps, experiments & everyday utilities",
  alternates: { canonical: "https://projects.voltura.se/" },
  description: "Explore original open-source projects by Joakim Skoglund. Search apps and utilities, view real screenshots, and find product websites and GitHub repositories.",
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
