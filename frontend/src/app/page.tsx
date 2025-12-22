import { Hero } from "@/components/layout/Hero";
// REMOVIDO: import { PricingSection } ...
import { MangaList } from "@/components/catalog/MangaList";
import { RankingSection } from "@/components/home/RankingSection";
import { RecommendedSection } from "@/components/home/RecommendedSection"; // <--- NOVO

export default function Home() {
  return (
    <main className="min-h-screen bg-gato-black pb-20">
      
      {/* 1. Destaque Principal */}
      <Hero />

      {/* 2. Recomendados (NOVO - Substitui Planos) */}
      <RecommendedSection />

      {/* 3. Top 10 (Ranking) */}
      <RankingSection />

      {/* 4. Lista Geral (Lançamentos) */}
      <div className="bg-gradient-to-b from-black/0 via-black to-black relative z-20">
        <MangaList />
      </div>

    </main>
  );
}