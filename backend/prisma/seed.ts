import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const adminEmail = "admin@xwz.rw";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const hash = await bcrypt.hash(password, rounds);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: "System",
      lastName: "Admin",
      passwordHash: hash,
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin: ${adminEmail} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
