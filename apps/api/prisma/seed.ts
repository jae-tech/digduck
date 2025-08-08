import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  console.log("Created user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
