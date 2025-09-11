import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 프로덕션 시드 데이터 생성 시작...");

  // 1. 서비스 생성
  const blogService = await prisma.services.upsert({
    where: { code: "NAVER_BLOG_CRAWLING" },
    update: {},
    create: {
      code: "NAVER_BLOG_CRAWLING",
      name: "네이버 블로그 크롤링",
      description: "네이버 블로그 검색 및 데이터 수집",
      sortOrder: 1,
    },
  });

  const smartstoreService = await prisma.services.upsert({
    where: { code: "NAVER_SMARTSTORE_CRAWLING" },
    update: {},
    create: {
      code: "NAVER_SMARTSTORE_CRAWLING",
      name: "네이버 스마트스토어 크롤링",
      description: "네이버 스마트스토어 상품 정보 및 리뷰 수집",
      sortOrder: 2,
    },
  });

  const mapService = await prisma.services.upsert({
    where: { code: "NAVER_MAP_CRAWLING" },
    update: {},
    create: {
      code: "NAVER_MAP_CRAWLING",
      name: "네이버 지도 크롤링",
      description: "네이버 지도 업체 정보 및 리뷰 수집",
      sortOrder: 3,
    },
  });

  // 2. 구독 플랜 생성
  const oneMonthPlan = await prisma.subscriptionPlans.upsert({
    where: { code: "ONE_MONTH" },
    update: {},
    create: {
      code: "ONE_MONTH",
      name: "1개월 구독",
      duration: 30,
      price: 30000,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
      sortOrder: 1,
    },
  });

  const threeMonthsPlan = await prisma.subscriptionPlans.upsert({
    where: { code: "THREE_MONTHS" },
    update: {},
    create: {
      code: "THREE_MONTHS",
      name: "3개월 구독",
      duration: 90,
      price: 88000,
      discount: 0.12,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
      sortOrder: 2,
    },
  });

  const sixMonthsPlan = await prisma.subscriptionPlans.upsert({
    where: { code: "SIX_MONTHS" },
    update: {},
    create: {
      code: "SIX_MONTHS",
      name: "6개월 구독",
      duration: 180,
      price: 153000,
      discount: 0.15,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
      sortOrder: 3,
    },
  });

  const twelveMonthsPlan = await prisma.subscriptionPlans.upsert({
    where: { code: "TWELVE_MONTHS" },
    update: {},
    create: {
      code: "TWELVE_MONTHS",
      name: "12개월 구독",
      duration: 365,
      price: 240000,
      discount: 0.2,
      features: {
        maxProducts: 500,
        maxCrawls: 2000,
        emailSupport: true,
        advancedAnalytics: true,
        apiAccess: true,
      },
      sortOrder: 4,
    },
  });

  // 3. 애드온 상품 생성
  const extraDeviceAddon = await prisma.addonProducts.upsert({
    where: { code: "EXTRA_DEVICE" },
    update: {},
    create: {
      code: "EXTRA_DEVICE",
      name: "추가 디바이스",
      unitPrice: 5000,
      description: "라이센스 디바이스 1대 추가",
    },
  });

  const subscriptionExtensionAddon = await prisma.addonProducts.upsert({
    where: { code: "SUBSCRIPTION_EXTENSION" },
    update: {},
    create: {
      code: "SUBSCRIPTION_EXTENSION",
      name: "구독 연장",
      unitPrice: 1000,
      description: "구독 기간 1일 연장",
    },
  });

  // 4. 관리자 사용자 생성
  const adminUser = await prisma.users.upsert({
    where: { email: "hello@digduck.app" },
    update: {},
    create: {
      email: "hello@digduck.app",
      name: "관리자",
      isAdmin: true,
    },
  });

  // 5. 테스트 사용자 생성
  const testUser = await prisma.users.upsert({
    where: { email: "test@digduck.app" },
    update: {},
    create: {
      email: "test@digduck.app",
      name: "테스트 사용자",
      isAdmin: false,
    },
  });

  // 6. 관리자용 네이버 블로그 라이센스 생성
  const adminLicenseKey = "ADMIN01096666339";
  await prisma.licenses.upsert({
    where: { licenseKey: adminLicenseKey },
    update: {},
    create: {
      userEmail: adminUser.email,
      licenseKey: adminLicenseKey,
      serviceId: blogService.id,
      subscriptionPlanId: twelveMonthsPlan.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후
      maxDevices: 9999,
      maxTransfers: 9999,
      activatedDevices: [],
    },
  });

  // 7. 테스트 사용자용 라이센스 생성 (3개)
  const testServices = [
    { service: blogService, suffix: "B" },
    { service: smartstoreService, suffix: "S" },
    { service: mapService, suffix: "M" },
  ];

  for (const { service, suffix } of testServices) {
    const testLicenseKey = `TEST01096666339${suffix}`;

    await prisma.licenses.upsert({
      where: { licenseKey: testLicenseKey },
      update: {},
      create: {
        userEmail: testUser.email,
        licenseKey: testLicenseKey,
        serviceId: service.id,
        subscriptionPlanId: oneMonthPlan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1개월 후
        maxDevices: 3,
        maxTransfers: 5,
        activatedDevices: [],
      },
    });
  }

  console.log("✅ 프로덕션 시드 데이터 생성 완료!");
  console.log("📊 생성된 데이터:");
  console.log(`   - 요금제: 4개 (1/3/6/12개월)`);
  console.log(`   - 관리자 계정: 1개`);
  console.log(`   - 테스트 계정: 1개`);
  console.log(`   - 라이센스: 4개 (관리자용 1개, 테스트용 3개)`);
  console.log("");
  console.log("💰 요금제 정보:");
  console.log(`   - 1개월: 30,000원`);
  console.log(`   - 3개월: 88,000원 (12% 할인)`);
  console.log(`   - 6개월: 153,000원 (15% 할인)`);
  console.log(`   - 12개월: 240,000원 (20% 할인)`);
  console.log("");
  console.log("🔑 계정 정보:");
  console.log(`   관리자: hello@digduck.app`);
  console.log(`     - 네이버 블로그: ADMIN01096666339`);
  console.log(`   테스트: test@digduck.app`);
  console.log(`     - 네이버 블로그: TEST0109666333B`);
  console.log(`     - 네이버 스마트스토어: TEST0109666333S`);
  console.log(`     - 네이버 지도: TEST0109666333M`);
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
