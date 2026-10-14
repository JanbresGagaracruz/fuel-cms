import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.lst_User.upsert({
    where: { UserID: 1 },
    update: {},
    create: {
      UsrNam: "admin",
      DisplayName: "System Administrator",
      Firstname: "System",
      Lastname: "Administrator",
      Email: "admin@fuelcms.local",
      PositionName: "System Administrator",
      enable: true,
      access_level: 4,
      password: hashedPassword,
      Psswrd: hashedPassword,
    },
  });

  console.log("✅ Admin user created:", admin.UsrNam);
  console.log("   Login: admin / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
