# Dig Duck API

Dig Duck 크롤링 플랫폼의 백엔드 API 서버. Fastify 기반의 고성능 REST API로 라이센스 관리, 크롤링 엔진, 이메일 서비스를 제공합니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.5-000000.svg)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.15-2D3748.svg)](https://www.prisma.io/)
[![Playwright](https://img.shields.io/badge/Playwright-1.55-2EAD33.svg)](https://playwright.dev/)

---

## 개요

Dig Duck API는 네이버 스마트스토어와 블로그 크롤링을 위한 백엔드 서비스입니다. 
Playwright 기반의 실제 브라우저 렌더링을 통해 안정적인 데이터 수집을 제공하며, JWT 인증과 라이센스 시스템으로 보안을 강화했습니다.

Fastify 프레임워크를 사용하여 Express보다 2-3배 빠른 성능을 제공하고, Prisma ORM으로 타입 안전한 데이터베이스 작업을 수행합니다.

---

## 기술 스택

**Core**
- **Node.js 18+** - 런타임 환경
- **Fastify 5.5** - 고성능 웹 프레임워크
- **TypeScript 5.9** - 타입 안전성

**Database**
- **PostgreSQL 17** - 관계형 데이터베이스
- **Prisma 6.15** - 타입 안전한 ORM

**Authentication & Security**
- **@fastify/jwt** - JWT 토큰 인증
- **bcryptjs** - 비밀번호 해싱
- **@fastify/helmet** - 보안 헤더
- **@fastify/cors** - CORS 처리
- **@fastify/rate-limit** - Rate Limiting

**Crawling Engine**
- **Playwright 1.55** - 브라우저 자동화
- **JSDOM 26.1** - HTML 파싱

**Email Service**
- **Nodemailer 7.0** - 이메일 발송 (Gmail, Outlook, SMTP)

**Monitoring & Logging**
- **Pino 9.9** - 고성능 구조화 로깅
- **@fastify/swagger** - OpenAPI 3.0 문서 자동 생성

**Development**
- **Vitest 3.2** - 테스트 프레임워크
- **tsx 4.20** - TypeScript 실행
- **Zod 4.1** - 스키마 검증

---

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- pnpm 10.15 이상
- PostgreSQL 17 이상
- Playwright Chromium (자동 설치)

### 설치

```bash
# 루트 디렉토리에서 의존성 설치
cd ../..
pnpm install

# Playwright 브라우저 설치
cd apps/api
pnpm exec playwright install chromium
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 값을 설정하세요:

```env
# 서버 설정
NODE_ENV=development
PORT=8080
HOST=0.0.0.0

# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/digduck

# JWT 인증
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# 보안
BCRYPT_SALT_ROUNDS=12
LICENSE_SALT=your-license-salt-16-chars

# CORS
CORS_ORIGIN=http://localhost:1420
RATE_LIMIT_MAX=100

# 네이버 로그인 (크롤러용)
NAVER_LOGIN_ID=your_naver_id
NAVER_LOGIN_PASSWORD=your_naver_password

# 이메일 서비스
MAIL_FROM=noreply@digduck.app
MAIL_PROVIDER=gmail
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587

# 기타
LOG_LEVEL=debug
PRODUCT_NAME=DigDuck
CLIENT_URL=http://localhost:1420
COMPANY_NAME=DigDuck
```

### 데이터베이스 마이그레이션

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 마이그레이션 실행
pnpm db:migrate

# 시드 데이터 생성 (선택사항)
pnpm db:seed

# Prisma Studio로 데이터베이스 확인
pnpm db:studio
```

### 개발 서버 실행

```bash
# 개발 모드 (Hot Reload)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

**API 문서 확인**
- Swagger UI: http://localhost:8080/documentation
- OpenAPI JSON: http://localhost:8080/documentation/json

---

## 프로젝트 구조

```
src/
├── app.ts                          # Fastify 앱 초기화
├── server.ts                       # 서버 시작 포인트
│
├── controllers/                    # API 엔드포인트
│   ├── admin.controller.ts            # 관리자 API
│   ├── auth.controller.ts             # 인증 API (로그인, 검증)
│   ├── license.controller.ts          # 라이센스 API
│   ├── mail.controller.ts             # 이메일 API
│   └── naver.controller.ts            # 네이버 크롤링 API
│
├── services/                       # 비즈니스 로직
│   ├── auth.service.ts                # 인증 서비스
│   ├── license.service.ts             # 라이센스 서비스
│   ├── mail.service.ts                # 이메일 서비스
│   ├── mail-template.service.ts       # 이메일 템플릿
│   ├── crawl.service.ts               # 크롤링 서비스
│   └── crawlers/                      # 크롤러 구현체
│       ├── base-crawler.ts               # 베이스 크롤러 클래스
│       ├── smart-store-crawler.ts        # 스마트스토어 크롤러
│       └── naver-blog-crawler.ts         # 네이버 블로그 크롤러
│
├── automation/                     # 브라우저 자동화
│   ├── browser/
│   │   ├── chromium-browser-manager.ts   # Chromium 브라우저 관리
│   │   └── stealth-page-factory.ts       # Stealth 모드 페이지
│   ├── services/
│   └── types/
│
├── middlewares/                    # 미들웨어
│   ├── auth.middleware.ts             # JWT 검증
│   ├── error.middleware.ts            # 에러 핸들링
│   └── ...
│
├── config/                         # 설정
│   └── env.ts                         # 환경 변수 스키마 (Zod)
│
├── types/                          # 타입 정의
│
├── utils/                          # 유틸리티
│   ├── logger.ts                      # Pino 로거
│   └── auto-register.ts               # 컨트롤러 자동 등록
│
└── plugins/                        # Fastify 플러그인
    └── prisma.ts                      # Prisma 플러그인

prisma/
├── schema.prisma                   # Prisma 스키마 정의
├── migrations/                     # 마이그레이션 이력
└── seed.ts                         # 시드 데이터
```

---

## 주요 기능

### 인증 시스템

**라이센스 기반 인증**
- 16자리 라이센스 키 (4-4-4-4 형식)로 사용자 인증
- JWT 토큰 발급 및 검증
- 관리자 라이센스: `ADMIN-xxxx-xxxx-xxxx` 형식으로 구분
- 토큰 만료 시간: 7일 (환경 변수로 설정 가능)

**디바이스 관리**
- 허용 디바이스 수: 기본 3대
- 디바이스 전송: 최대 5회
- 플랫폼 추적: WEB, DESKTOP

**보안 기능**
- bcryptjs를 통한 안전한 비밀번호 해싱
- Rate Limiting으로 API 남용 방지
- CORS 설정으로 허용된 도메인만 접근
- Helmet을 통한 보안 헤더 설정

### 크롤링 엔진

**지원 플랫폼**
- 네이버 스마트스토어 (상품 리뷰 및 정보)
- 네이버 블로그 (포스트)
- 확장 가능: Coupang, Gmarket, Auction 등 (스키마 정의됨)

**크롤링 특징**
- Playwright 기반 실제 브라우저 렌더링
- Stealth 모드로 봇 탐지 회피
  - 최신 Chrome User-Agent 자동 생성
  - 랜덤 지연 (100-400ms)
  - 헤드리스 브라우저 탐지 우회
- Server-Sent Events (SSE)로 실시간 진행 상황 전송
- 자동 재시도 및 에러 핸들링
- 페이지별 순회 (최대 50페이지 제한)

**크롤링 프로세스**

```
1. URL 파싱 및 유효성 검증
2. 브라우저 초기화 (Chromium)
3. 페이지별 순회
4. DOM 파싱 및 데이터 추출
5. 데이터베이스 저장 (crawlHistory, crawlItems)
6. 클라이언트에 실시간 진행 상황 전송 (SSE)
```

### 라이센스 시스템

**라이센스 구조**
- 16자리 키: `XXXX-XXXX-XXXX-XXXX` 형식
- 관리자 라이센스: `ADMIN-xxxx-xxxx-xxxx` 형식
- 암호화: LICENSE_SALT 기반 해싱

**구독 관리**
- 구독 기간: 1개월, 3개월, 6개월, 12개월
- 자동 갱신 선택 가능
- 만료 알림 자동 이메일 발송

**라이센스 검증 흐름**

```
1. 클라이언트 → 라이센스 키 입력
2. API → 라이센스 키 검증
3. API → JWT 토큰 발급
4. 클라이언트 → 토큰 저장
5. 이후 모든 요청 → Bearer 토큰 첨부
```

### 이메일 시스템

**지원 프로바이더**
- SMTP (범용)
- Gmail (앱 비밀번호)
- Outlook
- Zoho

**템플릿 시스템**
- 템플릿 기반 이메일: 재사용 가능한 템플릿
- 변수 치환: 동적 콘텐츠 생성
- 이메일 이력: 발송 상태 추적 (PENDING, SENT, DELIVERED, FAILED, BOUNCED, OPENED, CLICKED)

**주요 이메일 유형**
- 라이센스 발급 알림
- 라이센스 만료 예정 알림
- 사용자 등록 환영 메일

---

## API 엔드포인트

### 인증

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/auth/login` | 라이센스 키로 로그인 | ❌ |
| `POST` | `/auth/verify` | JWT 토큰 검증 | ✅ |

**예시: 로그인**

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "XXXX-XXXX-XXXX-XXXX"}'
```

**응답**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false
  }
}
```

### 라이센스

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/license/info` | 라이센스 정보 조회 | ✅ |
| `POST` | `/license/activate` | 디바이스 활성화 | ✅ |
| `POST` | `/license/transfer` | 디바이스 전송 | ✅ |
| `POST` | `/admin/license/create` | 라이센스 생성 | ✅ (관리자) |

### 크롤링

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/naver/crawl/smartstore` | 스마트스토어 크롤링 | ✅ |
| `POST` | `/naver/crawl/blog` | 네이버 블로그 크롤링 | ✅ |
| `GET` | `/naver/crawl/history` | 크롤링 이력 조회 | ✅ |
| `GET` | `/naver/crawl/progress/:id` | 실시간 진행 상황 (SSE) | ✅ |

**예시: 스마트스토어 크롤링**

```bash
curl -X POST http://localhost:8080/naver/crawl/smartstore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://smartstore.naver.com/example",
    "maxPages": 10
  }'
```

### 이메일

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/mail/send` | 이메일 발송 | ✅ (관리자) |
| `POST` | `/mail/send-template` | 템플릿 이메일 발송 | ✅ (관리자) |

### 관리자

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/admin/users` | 사용자 목록 조회 | ✅ (관리자) |
| `GET` | `/admin/dashboard` | 대시보드 데이터 | ✅ (관리자) |

### Health Check

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/health` | 헬스 체크 | ❌ |

---

## 데이터베이스 스키마

### 핵심 테이블

**users**
```sql
- id (PK)
- email (Unique)
- name, nickname
- isAdmin (관리자 여부)
- createdAt, updatedAt
```

**licenseUsers**
```sql
- userEmail (PK, FK → users.email)
- licenseKey (Unique)
- allowedDevices (기본 3)
- maxTransfers (기본 5)
- activatedDevices (JSON)
- createdAt
```

**licenseSubscriptions**
```sql
- id (PK)
- userEmail (FK)
- subscriptionType (ONE_MONTH, THREE_MONTHS, etc.)
- startDate, endDate
- isActive
```

**crawlHistory**
```sql
- id (PK)
- userEmail (FK)
- deviceId
- sourceSite (SMARTSTORE, NAVER_BLOG, etc.)
- searchUrl, searchKeywords
- status (PENDING, RUNNING, SUCCESS, FAILED)
- itemsFound, itemsCrawled, pagesProcessed
- startedAt, completedAt, durationMs
- errorMessage, errorDetails
- crawlSettings (JSON)
```

**crawlItems**
```sql
- id (PK)
- crawlHistoryId (FK)
- itemId, title, content, url
- rating, reviewDate, reviewerName
- price, originalPrice, discount, stock
- imageUrls, videoUrls (JSON)
- siteSpecificData (JSON)
- itemOrder, pageNumber
```

**mailHistory**
```sql
- id (PK)
- userEmail (FK)
- fromEmail, toEmail, ccEmails, bccEmails
- subject, templateId, templateVars
- provider (SMTP, GMAIL, OUTLOOK, ZOHO)
- status (PENDING, SENT, DELIVERED, FAILED)
- sentAt, deliveredAt, openedAt, clickedAt
```

---

## 개발 가이드

### Prisma 관리

```bash
# Prisma Studio 실행 (GUI)
pnpm db:studio

# 스키마 변경 후 마이그레이션 생성
pnpm db:migrate

# 프로덕션 마이그레이션 (롤백 불가)
pnpm db:migrate:deploy

# 데이터베이스 리셋 (개발 환경만)
pnpm db:reset

# 시드 데이터 재실행
pnpm db:seed

# Prisma 클라이언트 재생성
pnpm db:generate
```

### 테스트

```bash
# 전체 테스트 실행
pnpm test

# Watch 모드
pnpm test:watch

# 커버리지 확인
pnpm test:coverage

# 특정 파일 테스트
pnpm test auth.service.test.ts
```

### 로깅

Pino를 사용한 구조화된 로깅:

```typescript
import { logger } from './utils/logger'

// 일반 로그
logger.info('Server started', { port: 8080 })

// 에러 로그
logger.error('Failed to connect', { error: err })

// 디버그 로그 (LOG_LEVEL=debug인 경우만)
logger.debug('Request received', { body: req.body })
```

### 개발 시 주의사항

**1. Playwright 브라우저**

크롤러를 로컬에서 테스트하려면 Chromium을 설치해야 합니다:

```bash
pnpm exec playwright install chromium
```

**2. 환경 변수**

`.env` 파일이 없으면 서버가 시작되지 않습니다. `.env.example`을 참고하세요.

**3. Prisma 클라이언트**

스키마 변경 후 반드시 클라이언트를 재생성하세요:

```bash
pnpm db:generate
```

**4. PostgreSQL**

Docker를 사용하는 경우:

```bash
docker-compose up -d postgres
```

---

## 배포

### Docker

**이미지 빌드**

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# TypeScript 빌드
pnpm build

# Docker 이미지 빌드
docker build -t digduck-api:latest .
```

**컨테이너 실행**

```bash
docker run -d \
  --name digduck-api \
  -p 8080:8080 \
  --env-file .env \
  digduck-api:latest
```

### GitHub Actions

`main` 브랜치에 푸시하면 자동으로 배포됩니다:

1. 변경 감지 (`apps/api/` 또는 `packages/`)
2. Prisma 클라이언트 생성
3. TypeScript 빌드
4. Docker 이미지 빌드 및 푸시
5. EC2 SSH 접속
6. 블루그린 배포
7. Health Check 및 트래픽 전환

### 블루그린 배포

무중단 배포 전략으로 서비스 다운타임 제로를 달성합니다:

```
Nginx (Port 8080)
   │
   ├─→ Blue Container (Port 8081)
   └─→ Green Container (Port 8082)
```

배포 스크립트는 자동으로:
- 현재 환경 확인
- 비활성 환경에 새 버전 배포
- Health Check 실행
- 성공 시 트래픽 전환
- 실패 시 자동 롤백

---

## 성능 최적화

**Fastify 최적화**
- Fastify는 Express보다 2-3배 빠른 성능 제공
- 플러그인 시스템으로 필요한 기능만 로드
- JSON 스키마 기반 검증으로 성능 향상

**데이터베이스 최적화**
- Prisma의 연결 풀링 활용
- 인덱스 최적화 (email, licenseKey 등)
- N+1 쿼리 방지

**크롤링 최적화**
- 브라우저 인스턴스 재사용
- 페이지 제한으로 리소스 관리
- 비동기 처리로 동시성 향상

---

## 보안

**인증 & 권한**
- JWT 토큰 기반 인증
- 라이센스 키 서버사이드 검증
- 관리자 권한 분리

**API 보호**
- Rate Limiting (기본 100 req/min)
- CORS 설정 (허용된 도메인만)
- Helmet을 통한 보안 헤더

**데이터 보호**
- bcryptjs를 통한 비밀번호 해싱
- Prisma ORM으로 SQL Injection 방지
- 환경 변수로 민감 정보 관리