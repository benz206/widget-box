import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const email = "demo@widget.box";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Demo User",
        passwordHash: await hash("password123", 10),
      },
    });
  }
  console.log("Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
