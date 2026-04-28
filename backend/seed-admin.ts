import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const prisma = new PrismaClient();
  const email = 'quacinyadi@yahoo.com';
  const password = 'school@12';
  
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
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
