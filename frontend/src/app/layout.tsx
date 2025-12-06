import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar"; // <--- Importe aqui

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gato Comics",
  description: "O melhor leitor de webtoons do mercado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gato-black text-gato-ghost antialiased`}>
        <Navbar /> {/* <--- Adicione aqui */}
        <main className="pt-16"> {/* Padding-top 16 para o conteúdo não ficar embaixo do header fixo */}
          {children}
        </main>
      </body>
    </html>
  );
}