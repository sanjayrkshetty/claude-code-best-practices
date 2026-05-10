import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J.A.R.V.I.S. — Sanjay R K Shetty",
  description: "Just A Rather Very Intelligent System — Personal AI dashboard for Sanjay R K Shetty",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
