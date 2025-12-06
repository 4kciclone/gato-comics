// backend/prisma/seed.ts
import { PrismaClient, PlanTier } from '@prisma/client'; // <--- Importei PlanTier aqui
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed...');

  // 1. Criar Planos (Usando o Enum PlanTier corretamente)
  const plans = [
    { name: 'Caçador Bronze', tier: PlanTier.BRONZE, price: 6.99, monthlyPatinhas: 10, maxWorksSelect: 1, storeDiscount: 5 },
    { name: 'Caçador Prata', tier: PlanTier.PRATA, price: 14.99, monthlyPatinhas: 15, maxWorksSelect: 2, storeDiscount: 8 },
    { name: 'Caçador Ouro', tier: PlanTier.OURO, price: 25.99, monthlyPatinhas: 20, maxWorksSelect: 3, storeDiscount: 10 },
    { name: 'Rei Platina', tier: PlanTier.PLATINA, price: 35.99, monthlyPatinhas: 30, maxWorksSelect: 7, storeDiscount: 15 },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { tier: p.tier },
      update: {},
      create: p,
    });
  }
  console.log('✅ Planos criados.');

  // 2. Criar Pacotes de Patinhas
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
  console.log('✅ Pacotes criados.');

  // 3. Criar Usuário Admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gatocomics.com' },
    update: {},
    create: {
      email: 'admin@gatocomics.com',
      passwordHash,
      fullName: 'Admin Supremo',
      role: 'ADMIN',
      patinhasBalance: 9999,
    },
  });
  console.log('✅ Admin criado (admin@gatocomics.com / admin123).');

  // 4. Criar Obra de Exemplo (Solo Leveling)
  // Nota: Primeiro verificamos se ela já existe para não duplicar no seed
  const existingWork = await prisma.work.findUnique({ where: { slug: 'solo-leveling' }});
  
  if (!existingWork) {
    const solo = await prisma.work.create({
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
            { number: 1, title: 'O Começo', isFree: true, price: 0, pages: ['https://exemplo.com/pg1.jpg'] },
            { number: 2, title: 'O Templo', isFree: true, price: 0, pages: ['https://exemplo.com/pg1.jpg'] },
            { number: 3, title: 'O Sorriso', isFree: false, price: 1, pages: ['https://exemplo.com/pg1.jpg'] },
          ]
        }
      }
    });
    console.log(`✅ Obra criada: ${solo.title}`);
  } else {
    console.log('ℹ️ Obra Solo Leveling já existe.');
  }

  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });