import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "누적수익v2",
  description: "누적수익 프로젝트 v2",
};

export const runtime = 'edge';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased font-sans dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
