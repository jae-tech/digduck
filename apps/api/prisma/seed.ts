import { PrismaClient } from "@prisma/client";
import { BillingCycle } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 프로덕션 시드 데이터 생성 시작...");

  // 1. 요금제 생성 (실제 서비스용)
  const oneMonth = await prisma.plans.upsert({
    where: { name: "1개월 구독" },
    update: {},
    create: {
      name: "1개월 구독",
      price: 30000,
      billingCycle: BillingCycle.ONE_MONTH,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
    },
  });

  const threeMonths = await prisma.plans.upsert({
    where: { name: "3개월 구독" },
    update: {},
    create: {
      name: "3개월 구독",
      price: 88000,
      billingCycle: BillingCycle.THREE_MONTHS,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
    },
  });

  const sixMonths = await prisma.plans.upsert({
    where: { name: "6개월 구독" },
    update: {},
    create: {
      name: "6개월 구독",
      price: 153000,
      billingCycle: BillingCycle.SIX_MONTHS,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
    },
  });

  const twelveMonths = await prisma.plans.upsert({
    where: { name: "12개월 구독" },
    update: {},
    create: {
      name: "12개월 구독",
      price: 240000,
      billingCycle: BillingCycle.TWELVE_MONTHS,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
    },
  });

  // 2. 관리자 사용자 생성
  const adminUser = await prisma.users.upsert({
    where: { email: "hello@digduck.app" },
    update: {},
    create: {
      email: "hello@digduck.app",
      name: "관리자",
      isAdmin: true,
    },
  });

  // 3. 관리자 라이센스 생성
  await prisma.license_users.upsert({
    where: { email: adminUser.email },
    update: {},
    create: {
      email: adminUser.email,
      licenseKey: "ADMIN01096666339",
      allowedDevices: 9999,
      maxTransfers: 9999,
      activatedDevices: [],
    },
  });

  console.log("✅ 프로덕션 시드 데이터 생성 완료!");
  console.log("📊 생성된 데이터:");
  console.log(`   - 요금제: 4개 (1/3/6/12개월)`);
  console.log(`   - 관리자 계정: 1개`);
  console.log("");
  console.log("💰 요금제 정보:");
  console.log(`   - 1개월: 30,000원`);
  console.log(`   - 3개월: 88,000원 (12% 할인)`);
  console.log(`   - 6개월: 153,000원 (15% 할인)`);
  console.log(`   - 12개월: 240,000원 (20% 할인)`);
  console.log("");
  console.log("🔑 관리자 계정:");
  console.log(`   이메일: hello@digduck.app`);
  console.log(`   라이센스: ADMIN01096666339`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 시드 실행 중 오류 발생:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
