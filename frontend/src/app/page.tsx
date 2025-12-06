import { Hero } from "@/components/layout/Hero";
import { PricingSection } from "@/components/store/PricingSection";
import { MangaList } from "@/components/catalog/MangaList";
import { RankingSection } from "@/components/home/RankingSection"; // <--- Importe

export default function Home() {
  return (
    <main className="min-h-screen bg-gato-black pb-20">
      
      <Hero />

      {/* Nova Seção de Ranking */}
      <RankingSection />

      {/* Lista de Lançamentos */}
      <div className="bg-gradient-to-b from-black/0 via-black to-black relative z-20">
        <MangaList />
      </div>

      <PricingSection />

    </main>
  );
}