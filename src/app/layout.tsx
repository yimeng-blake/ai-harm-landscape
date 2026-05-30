import type { Metadata } from "next";
import "./globals.css";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "AI Harm Landscape",
  description: "Interactive Visual Analytics of AI Incidents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <Nav />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
