const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  const prisma = new PrismaClient({ adapter });
  
  const email = 'quacinyadi@yahoo.com';
  const password = '12345678';
  
  const hash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      role: 'ADMIN',
      password: hash 
    },
    create: { 
      email, 
      password: hash, 
      role: 'ADMIN' 
    },
  });
  
  console.log('Admin user created/updated:', user.email);
  await prisma.$disconnect();
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
