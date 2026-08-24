const prisma = require('../prisma/client');

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true, token_version: true }
    });
    console.log('Registered Users Count:', users.length);
    users.forEach(u => console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Version: ${u.token_version}`));
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
