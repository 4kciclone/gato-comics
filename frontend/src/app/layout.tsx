import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gato Comics",
  description: "A melhor plataforma de webtoons do Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        {/* MONETAG VERIFICATION TAG */}
        {/* Substitua o content abaixo pelo código que a Monetag te der no painel */}
        <meta name="monetag" content="e2804658af127602e7df221c43757497"></meta>      </head>
      <body className={`${inter.className} bg-gato-black text-gato-ghost antialiased`}>
        <Navbar />
        {/* Padding top para compensar a navbar fixa */}
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}