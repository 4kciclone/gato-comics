import { PrismaClient, PlanTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed (Correção de Duplicatas)...');

  // 1. Criar Planos (Upsert evita duplicatas)
  const plans = [
    { name: 'Caçador Bronze', tier: PlanTier.BRONZE, price: 6.99, monthlyPatinhas: 10, maxWorksSelect: 1, storeDiscount: 5 },
    { name: 'Caçador Prata', tier: PlanTier.PRATA, price: 14.99, monthlyPatinhas: 15, maxWorksSelect: 2, storeDiscount: 8 },
    { name: 'Caçador Ouro', tier: PlanTier.OURO, price: 25.99, monthlyPatinhas: 20, maxWorksSelect: 3, storeDiscount: 10 },
    { name: 'Rei Platina', tier: PlanTier.PLATINA, price: 35.99, monthlyPatinhas: 30, maxWorksSelect: 7, storeDiscount: 15 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { tier: p.tier },
      update: { 
        price: p.price, 
        monthlyPatinhas: p.monthlyPatinhas,
        maxWorksSelect: p.maxWorksSelect,
        storeDiscount: p.storeDiscount
      },
      create: p,
    });
  }
  console.log('✅ Planos verificados.');

  // 2. CORREÇÃO: Limpar Pacotes Antigos e Recriar
  // Isso apaga todos os pacotes existentes para remover duplicatas
  await prisma.patinhaPack.deleteMany({});
  
  const packs = [
    { name: 'Punhado de Patinhas', patinhas: 10, bonus: 1, price: 5.99 },
    { name: 'Saco de Patinhas', patinhas: 20, bonus: 2, price: 9.99 },
    { name: 'Baú de Patinhas', patinhas: 30, bonus: 5, price: 14.99 },
    { name: 'Tesouro da Guilda', patinhas: 50, bonus: 12, price: 25.99 },
    { name: 'Hoard do Dragão', patinhas: 100, bonus: 30, price: 45.99 },
  ];

  for (const pack of packs) {
    await prisma.patinhaPack.create({ data: pack });
  }
  console.log('✅ Pacotes recriados (Limpos).');

  // 3. Admin (Upsert evita duplicatas)
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@gatocomics.com' },
    update: {}, // Não muda nada se já existe
    create: {
      email: 'admin@gatocomics.com',
      passwordHash,
      fullName: 'Admin Supremo',
      role: 'OWNER', // Garante que é Owner
      patinhasBalance: 9999,
    },
  });
  console.log('✅ Admin verificado.');

  // 4. Obra (Verifica se existe)
  const existingWork = await prisma.work.findUnique({ where: { slug: 'solo-leveling' }});
  if (!existingWork) {
    await prisma.work.create({
      data: {
        title: 'Solo Leveling',
        slug: 'solo-leveling',
        description: 'Em um mundo onde caçadores despertados combatem monstros mortais...',
        author: 'Chu-Gong',
        artist: 'Dubu (Redice Studio)',
        coverUrl: 'https://images.alphacoders.com/133/1330673.jpeg',
        tags: ['Ação', 'Fantasia', 'Sistema'],
        status: 'COMPLETED',
        chapters: {
          create: [
            { number: 1, title: 'O Começo', isFree: true, price: 0, pages: [] },
            { number: 2, title: 'O Templo', isFree: true, price: 0, pages: [] },
            { number: 3, title: 'O Sorriso', isFree: false, price: 1, pages: [] },
          ]
        }
      }
    });
    console.log(`✅ Obra criada.`);
  }

  console.log('🚀 Banco de dados corrigido!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });