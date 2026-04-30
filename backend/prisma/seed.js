require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminEmail = 'quacinyadi@yahoo.com';
  const adminPassword = '12345678';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminHash,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      password: adminHash,
      role: 'ADMIN',
    },
  });

  console.log('Admin user seeded:', adminEmail);

  // Create a default pitch owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@pitchbooker.com' },
    update: {},
    create: {
      email: 'owner@pitchbooker.com',
      password: await bcrypt.hash('password123', 10),
    },
  });

  // Create pitches
  const pitches = [
    {
      name: "Astra Turf East Legon",
      location: "East Legon, Accra",
      pricePerHour: 150,
      facilities: ["Floodlights", "Changing Rooms", "Parking"],
      openingTime: "06:00",
      closingTime: "23:00",
      ownerId: owner.id
    },
    {
      name: "McDan Town Park",
      location: "La, Accra",
      pricePerHour: 120,
      facilities: ["Floodlights", "Grandstand", "Washrooms"],
      openingTime: "06:00",
      closingTime: "23:00",
      ownerId: owner.id
    },
    {
      name: "Teshie Nungua Astroturf (Teps Park)",
      location: "Teshie-Nungua, Accra",
      pricePerHour: 130,
      facilities: ["Floodlights", "Bleachers", "Parking"],
      openingTime: "06:00",
      closingTime: "22:00",
      ownerId: owner.id
    }
  ];

  for (const pitch of pitches) {
    await prisma.pitch.create({
      data: pitch
    });
  }

  console.log('Database seeded with owner and initial pitches!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
