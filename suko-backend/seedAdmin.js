require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@suko.com';
  const adminPassword = 'adminpassword';

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'admin' }
        });
        console.log(`Updated existing user ${adminEmail} to admin role.`);
      } else {
        console.log(`Admin ${adminEmail} already exists.`);
      }
    } else {
      const password_hash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password_hash,
          role: 'admin'
        }
      });
      console.log(`Created new admin account: ${adminEmail} / ${adminPassword}`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
