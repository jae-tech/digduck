import { PrismaClient } from "@prisma/client";
import {
  BillingCycle,
  SubscriptionStatus,
  ItemType,
  MailProvider,
  MailStatus,
  SourceSite,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 개발/테스트 시드 데이터 생성 시작...");

  // 기본 시드 데이터가 있는지 확인
  const plansCount = await prisma.plans.count();
  if (plansCount === 0) {
    console.log(
      "⚠️ 기본 요금제가 없습니다. 먼저 'pnpm db:seed'를 실행해주세요."
    );
    return;
  }

  // 요금제 조회
  const oneMonthPlan = await prisma.plans.findFirst({
    where: { name: "1개월 구독" },
  });

  const twelveMonthsPlan = await prisma.plans.findFirst({
    where: { name: "12개월 구독" },
  });

  // 1. 테스트 사용자 생성
  const testUser1 = await prisma.users.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "테스트 사용자1",
      isAdmin: false,
    },
  });

  const testUser2 = await prisma.users.upsert({
    where: { email: "dev@digduck.app" },
    update: {},
    create: {
      email: "dev@digduck.app",
      name: "개발자 테스트",
      isAdmin: false,
    },
  });

  // 2. 테스트 사용자 라이센스 생성
  await prisma.licenseUsers.upsert({
    where: { userEmail: testUser1.email },
    update: {},
    create: {
      userEmail: testUser1.email,
      licenseKey: "TESTLICENSE001",
      allowedDevices: 3,
      maxTransfers: 5,
      activatedDevices: [],
    },
  });

  await prisma.licenseUsers.upsert({
    where: { userEmail: testUser2.email },
    update: {},
    create: {
      userEmail: testUser2.email,
      licenseKey: "DEVLICENSE002",
      allowedDevices: 5,
      maxTransfers: 10,
      activatedDevices: [],
    },
  });

  // 3. 테스트 구독 생성
  if (oneMonthPlan) {
    await prisma.subscriptions.upsert({
      where: { id: 1 },
      update: {},
      create: {
        userId: testUser1.id,
        planId: oneMonthPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        autoRenew: false,
      },
    });
  }

  if (twelveMonthsPlan) {
    await prisma.subscriptions.upsert({
      where: { id: 2 },
      update: {},
      create: {
        userId: testUser2.id,
        planId: twelveMonthsPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후
        autoRenew: true,
      },
    });
  }

  // 4. 테스트 라이센스 아이템 추가
  await prisma.licenseItems.create({
    data: {
      userEmail: testUser1.email,
      itemType: ItemType.SMARTSTORE_CRAWLER,
      quantity: 100,
    },
  });

  await prisma.licenseItems.create({
    data: {
      userEmail: testUser2.email,
      itemType: ItemType.SMARTSTORE_CRAWLER,
      quantity: 500,
    },
  });

  // 5. 샘플 크롤링 템플릿 생성
  await prisma.crawlTemplates.create({
    data: {
      userEmail: testUser1.email,
      name: "스마트스토어 기본 템플릿",
      description: "네이버 스마트스토어 상품 정보 크롤링을 위한 기본 템플릿",
      sourceSite: SourceSite.SMARTSTORE,
      maxPages: 10,
      maxItems: 1000,
      requestDelay: 1000,
      isPublic: true,
      filters: {
        minPrice: 0,
        maxPrice: 1000000,
        hasReviews: true,
      },
      selectors: {
        title: ".product-title",
        price: ".price",
        rating: ".rating",
      },
    },
  });

  await prisma.crawlTemplates.create({
    data: {
      userEmail: testUser2.email,
      name: "쿠팡 상품 템플릿",
      description: "쿠팡 상품 크롤링 테스트용 템플릿",
      sourceSite: SourceSite.COUPANG,
      maxPages: 5,
      maxItems: 500,
      requestDelay: 1500,
      isPublic: false,
      filters: {
        minPrice: 10000,
        maxPrice: 500000,
      },
      selectors: {
        title: ".prod-buy-header__title",
        price: ".total-price",
        rating: ".rating",
      },
    },
  });

  // 6. 샘플 메일 히스토리 생성
  await prisma.mailHistory.create({
    data: {
      userEmail: testUser1.email,
      fromEmail: "hello@digduck.app",
      toEmail: "test@example.com",
      subject: "환영합니다! DigDuck 서비스 가입을 축하드립니다.",
      templateId: "welcome",
      templateVars: {
        userName: "테스트 사용자1",
        serviceName: "DigDuck",
      },
      provider: MailProvider.GMAIL,
      messageId: "welcome-test-001",
      status: MailStatus.SENT,
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
    },
  });

  await prisma.mailHistory.create({
    data: {
      userEmail: testUser2.email,
      fromEmail: "hello@digduck.app",
      toEmail: "dev@digduck.app",
      subject: "크롤링 작업 완료 알림",
      templateId: "notification",
      templateVars: {
        userName: "개발자 테스트",
        jobId: "12345",
        itemCount: 150,
      },
      provider: MailProvider.ZOHO,
      messageId: "notification-dev-001",
      status: MailStatus.DELIVERED,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5시간 전
    },
  });

  await prisma.mailHistory.create({
    data: {
      fromEmail: "hello@digduck.app",
      toEmail: "invalid-email@nonexistent.com",
      subject: "알림: 크롤링 작업이 완료되었습니다.",
      templateId: "notification",
      provider: MailProvider.SMTP,
      status: MailStatus.FAILED,
      errorMessage: "Invalid recipient address",
    },
  });

  console.log("✅ 개발/테스트 시드 데이터 생성 완료!");
  console.log("📊 생성된 데이터:");
  console.log(`   - 테스트 사용자: 2명`);
  console.log(`   - 테스트 구독: 2개`);
  console.log(`   - 라이센스: 2개`);
  console.log(`   - 크롤링 템플릿: 2개`);
  console.log(`   - 메일 히스토리: 3개`);
  console.log("");
  console.log("🔑 테스트 계정 정보:");
  console.log(`   사용자1: test@example.com (라이센스: TESTLICENSE001)`);
  console.log(`   사용자2: dev@digduck.app (라이센스: DEVLICENSE002)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 개발 시드 실행 중 오류 발생:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
