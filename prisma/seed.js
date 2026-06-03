const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const sellerPassword = await bcrypt.hash('Seller123', 10);

  // Seed Admin
  await prisma.user.upsert({
    where: { email: 'admin@aasa.com' },
    update: {},
    create: {
      email: 'admin@aasa.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Seed Seller
  await prisma.user.upsert({
    where: { email: 'seller@aasa.com' },
    update: {},
    create: {
      email: 'seller@aasa.com',
      name: 'Seller User',
      password: sellerPassword,
      role: 'SELLER',
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
