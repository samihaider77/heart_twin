import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardiac Digital Twin",
  description: "Interactive cardiac monitoring dashboard with AI-assisted analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
