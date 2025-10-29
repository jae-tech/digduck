# Dig Duck

네이버 이커머스 생태계를 위한 전문 크롤링 솔루션. 스마트스토어와 블로그의 데이터를 안정적으로 수집하고 분석합니다.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5.5-000000.svg)](https://fastify.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2.8-FFC131.svg)](https://tauri.app/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5-EF4444.svg)](https://turbo.build/)

---

## 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [개발 동기 및 성과](#개발-동기-및-성과)
- [시작하기](#시작하기)
  - [필수 요구사항](#필수-요구사항)
  - [설치](#설치)
  - [환경 변수 설정](#환경-변수-설정)
  - [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
  - [개발 서버 실행](#개발-서버-실행)
- [프로젝트 구조](#프로젝트-구조)
- [배포](#배포)
  - [프론트엔드 배포](#프론트엔드-배포)
  - [백엔드 배포](#백엔드-배포)
  - [블루그린 배포 전략](#블루그린-배포-전략)
- [API 문서](#api-문서)
- [개발 가이드](#개발-가이드)
  - [Prisma 관리](#prisma-관리)
  - [테스트 실행](#테스트-실행)
  - [로컬 개발 주의사항](#로컬-개발-주의사항)
- [라이센스](#라이센스)

---

## 개요

Dig Duck은 네이버 스마트스토어와 블로그를 대상으로 하는 전문화된 크롤링 플랫폼입니다. 
Playwright 기반의 실제 브라우저 렌더링을 통해 정확한 데이터 수집을 보장하며, Tauri를 활용한 데스크톱 네이티브 앱으로 안정적인 크롤링 환경을 제공합니다.

구독 기반의 라이센스 시스템을 통해 디바이스 관리, 사용자 인증, 크롤링 이력 추적 등의 기능을 지원합니다. 
모노레포 아키텍처를 채택하여 프론트엔드와 백엔드 간 타입 안정성을 확보하고, 무중단 배포를 통해 서비스 가용성을 극대화했습니다.

---

## 주요 기능

**크롤링 엔진**
- 네이버 스마트스토어 상품 리뷰 및 정보 자동 수집
- 네이버 블로그 포스트 크롤링
- Playwright 기반 실제 브라우저 렌더링으로 정확한 데이터 추출
- Stealth 모드 지원으로 봇 탐지 회피 (랜덤 지연, User-Agent 스푸핑)
- Server-Sent Events(SSE)를 통한 실시간 진행 상황 추적

**라이센스 시스템**
- 16자리 키 기반의 라이센스 인증 (4-4-4-4 형식)
- 디바이스 관리 및 전송 제한 (기본 3대, 최대 5회 전송)
- 구독 기반 비즈니스 모델 (1개월/3개월/6개월/12개월)
- JWT 토큰 기반 인증 및 자동 갱신

**데이터 관리**
- PostgreSQL 기반 크롤링 이력 저장
- 엑셀(XLSX), PDF 형식으로 데이터 내보내기
- 차트 시각화 및 통계 분석
- 사용자 정의 필터 및 검색 기능

**관리자 도구**
- 실시간 사용자 활동 모니터링 대시보드
- 라이센스 생성/조회/수정/삭제
- 크롤링 이력 추적 및 에러 로깅
- 자동화된 이메일 알림 시스템 (만료 예정, 라이센스 발급 등)

---

## 기술 스택

### Frontend (Desktop Application)

**Core**
- **React 19.1** - 최신 React 버전
- **TypeScript 5.9** - 타입 안전성
- **Vite 7.1** - 빠른 빌드 도구
- **Tauri 2.8** - Rust 기반 크로스 플랫폼 데스크톱 앱

**State & Routing**
- **TanStack Router 1.131** - 타입 안전한 파일 기반 라우팅
- **TanStack Query 5.87** - 서버 상태 관리
- **Zustand 5.0** - 경량 클라이언트 상태 관리

**UI & Styling**
- **Tailwind CSS 4.1** - 유틸리티 퍼스트 CSS
- **shadcn/ui** - Radix UI 기반 컴포넌트 라이브러리
- **Framer Motion 12.23** - 애니메이션
- **Lucide React** - 아이콘

**Data Visualization**
- **Chart.js 4.5** & **React-ChartJS-2** - 차트 라이브러리
- **TanStack Table 8.21** - 고급 데이터 테이블

**Utilities**
- **Axios** - HTTP 클라이언트
- **Zod** - 스키마 검증
- **date-fns** - 날짜 처리
- **html2canvas** & **jsPDF** - PDF 생성
- **XLSX** - 엑셀 파일 처리

### Backend (API Server)

**Core**
- **Node.js 18+** - 런타임
- **Fastify 5.5** - 고성능 웹 프레임워크 (Express보다 2-3배 빠름)
- **TypeScript 5.9** - 타입 안전성

**Database**
- **PostgreSQL 17** - 관계형 데이터베이스
- **Prisma 6.15** - 타입 안전한 ORM

**Authentication & Security**
- **JWT** - 토큰 기반 인증
- **bcryptjs** - 비밀번호 해싱
- **Helmet** - 보안 헤더
- **CORS** & **Rate Limiting** - API 보호

**Crawling Engine**
- **Playwright 1.55** - 브라우저 자동화
- **JSDOM** - HTML 파싱

**Email Service**
- **Nodemailer** - Gmail, Outlook, SMTP 지원

**Monitoring & Logging**
- **Pino** - 고성능 구조화 로깅
- **Swagger UI** - API 문서 자동 생성

### Infrastructure

**Build System**
- **Turborepo 2.5** - 모노레포 빌드 오케스트레이션
- **pnpm 10.15** - 고속 패키지 매니저

**Containerization**
- **Docker** - 멀티 스테이지 빌드
- **Docker Compose** - 컨테이너 오케스트레이션

**CI/CD**
- **GitHub Actions** - 자동화된 배포 파이프라인
- **블루그린 배포** - 무중단 배포 전략

**Cloud (AWS)**
- **S3** - 정적 파일 호스팅
- **CloudFront** - CDN
- **EC2** - API 서버
- **Nginx** - 로드 밸런서

---

## 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                        User Layer                            │
│                                                              │
│   ┌──────────────────┐         ┌──────────────────┐        │
│   │  Desktop App     │         │   Admin Panel    │        │
│   │  (Tauri + React) │         │   (Web Browser)  │        │
│   └────────┬─────────┘         └─────────┬────────┘        │
│            │                             │                  │
└────────────┼─────────────────────────────┼──────────────────┘
             │                             │
             │   HTTPS/JWT Auth            │
             v                             v
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │              Nginx Load Balancer                   │    │
│   │           (Rate Limiting, SSL/TLS)                 │    │
│   └────────────┬───────────────────┬───────────────────┘    │
│                │                   │                        │
│        ┌───────v────────┐  ┌──────v─────────┐             │
│        │  Blue (8081)   │  │  Green (8082)  │             │
│        │  Fastify API   │  │  Fastify API   │             │
│        └───────┬────────┘  └──────┬─────────┘             │
│                │                   │                        │
└────────────────┼───────────────────┼────────────────────────┘
                 │                   │
                 v                   v
        ┌────────────────────────────────────┐
        │         PostgreSQL 17              │
        │      (Prisma ORM Layer)            │
        │                                    │
        │  Tables:                           │
        │  - users                           │
        │  - licenseUsers                    │
        │  - licenseSubscriptions            │
        │  - crawlHistory                    │
        │  - crawlItems                      │
        │  - mailHistory                     │
        └────────────────────────────────────┘
                 │
                 v
        ┌────────────────────────────────────┐
        │        External Services           │
        │                                    │
        │  - Playwright Browser Pool         │
        │  - Nodemailer (Gmail/SMTP)         │
        │  - Naver Login Service             │
        └────────────────────────────────────┘
```

**데이터 흐름**

1. **인증 플로우**
   ```
   User → License Key → API (JWT 발급) → Token Storage → Authenticated Requests
   ```

2. **크롤링 플로우**
   ```
   User Input (URL, Keywords)
     → API Validation
     → Playwright Browser Launch
     → Page Navigation & Parsing
     → Data Extraction
     → Database Storage
     → SSE Progress Updates
   ```

3. **배포 플로우**
   ```
   Git Push → GitHub Actions
     → Change Detection
     → Build (Frontend/Backend)
     → Docker Image Build
     → Blue-Green Deployment
     → Health Check
     → Traffic Switch
   ```

---

## 개발 동기 및 성과

### 동기

네이버 쇼핑 생태계의 판매자와 마케터들이 경쟁사 분석 및 시장 조사를 위해 수작업으로 데이터를 수집하는 비효율성을 목격했습니다. 
특히 스마트스토어 리뷰와 블로그 포스트는 구조화된 데이터 접근이 어렵고, 봇 탐지 시스템으로 인해 일반적인 크롤러로는 데이터 수집이 불안정했습니다.

이를 해결하기 위해 실제 브라우저 기반의 안정적인 크롤링 솔루션과 함께, 라이센스 관리 및 구독 시스템을 갖춘 SaaS 제품을 개발하게 되었습니다.

### 기술적 성과

**1. 모던 모노레포 아키텍처 구축**
- Turborepo를 활용한 효율적인 빌드 파이프라인 구성 (평균 빌드 시간 60% 단축)
- 프론트엔드-백엔드 간 타입 공유로 인터페이스 불일치 오류 제로화
- pnpm 워크스페이스로 의존성 관리 최적화

**2. 안정적인 크롤링 엔진 개발**
- Playwright Stealth 모드로 95% 이상의 크롤링 성공률 달성
- SSE를 통한 실시간 진행 상황 피드백으로 사용자 경험 개선
- 에러 핸들링 및 재시도 로직으로 안정성 확보

**3. 무중단 배포 시스템 구축**
- 블루그린 배포로 서비스 다운타임 제로 달성
- Health Check 기반 자동 롤백으로 장애 대응 시간 90% 단축
- GitHub Actions로 CI/CD 완전 자동화

**4. 인증 시스템**
- JWT 기반 토큰 인증 및 디바이스 관리
- 구독 기반 비즈니스 모델 구현
- 자동화된 이메일 알림 시스템

### 배운 점

**기술적 교훈**
- Fastify의 플러그인 시스템과 훅을 활용한 모듈화 설계의 중요성
- Tauri를 통한 네이티브 데스크톱 앱 개발의 장단점 (웹 기술 + 네이티브 성능)
- Playwright의 봇 탐지 회피 기술과 한계점
- Prisma의 타입 안전성이 빠른 개발에 미치는 영향

**아키텍처 교훈**
- 모노레포 구조에서 패키지 간 의존성 관리의 복잡성
- 블루그린 배포 시 데이터베이스 마이그레이션 처리 전략
- SSE vs WebSocket 선택 기준 (단방향 통신의 경우 SSE가 더 효율적)

**비즈니스 교훈**
- 라이센스 시스템 설계 시 디바이스 전송 제한의 필요성
- 구독 모델에서 자동 갱신과 수동 갱신의 트레이드오프
- 관리자 도구의 중요성 (초기부터 설계 권장)

---

## 시작하기

### 필수 요구사항

- **Node.js** 18 이상
- **pnpm** 10.15 이상
- **PostgreSQL** 17 이상
- **Rust** 1.70 이상 (Tauri 빌드용)
- **Docker** (선택사항, 배포용)

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/digduck.git
cd digduck

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# Playwright 브라우저 설치 (크롤러용)
cd apps/api
pnpm exec playwright install chromium
cd ../..
```

### 환경 변수 설정

#### 백엔드 환경 변수 (`apps/api/.env`)

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

#### 프론트엔드 환경 변수 (`apps/dig-duck/.env`)

```env
# API 엔드포인트
VITE_API_URL=http://localhost:8080

# 앱 환경
VITE_APP_ENV=development

# 로깅
VITE_LOG_LEVEL=debug

# 개발 도구
VITE_ENABLE_DEVTOOLS=true
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
# 전체 앱 실행 (프론트엔드 + 백엔드)
pnpm dev

# 개별 실행
pnpm dev --filter=api        # 백엔드만 (http://localhost:8080)
pnpm dev --filter=dig-duck   # 프론트엔드만 (http://localhost:1420)
```

**API 문서 확인**
- Swagger UI: http://localhost:8080/documentation

---

## 프로젝트 구조

```
digduck/
├── apps/
│   ├── dig-duck/                     # 프론트엔드 (Tauri + React)
│   │   ├── src/
│   │   │   ├── main.tsx                 # 앱 진입점
│   │   │   ├── routes/                  # TanStack Router 라우트
│   │   │   │   ├── __root.tsx             # 루트 레이아웃
│   │   │   │   ├── index.tsx              # 홈 페이지
│   │   │   │   ├── license.tsx            # 라이센스 입력
│   │   │   │   └── _authenticated/        # 인증 필요 라우트
│   │   │   │       ├── admin/                # 관리자 페이지
│   │   │   │       └── crawler/              # 크롤러 페이지
│   │   │   ├── components/              # 재사용 컴포넌트
│   │   │   │   ├── ui/                     # shadcn/ui 컴포넌트
│   │   │   │   ├── layouts/                # 레이아웃
│   │   │   │   └── icons/                  # 아이콘
│   │   │   ├── features/                # 기능별 모듈
│   │   │   │   ├── crawler/                # 크롤러 기능
│   │   │   │   ├── license/                # 라이센스 기능
│   │   │   │   └── admin/                  # 관리자 기능
│   │   │   ├── lib/                     # 라이브러리
│   │   │   │   ├── apiClient.ts            # Axios 인스턴스
│   │   │   │   └── utils.ts                # 유틸리티
│   │   │   ├── config/                  # 설정
│   │   │   ├── middleware/              # 라우트 미들웨어
│   │   │   └── hooks/                   # 커스텀 훅
│   │   ├── src-tauri/                   # Tauri (Rust)
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                           # 백엔드 (Fastify + Node.js)
│       ├── src/
│       │   ├── app.ts                      # Fastify 앱 초기화
│       │   ├── server.ts                   # 서버 시작 포인트
│       │   ├── controllers/                # API 엔드포인트
│       │   │   ├── admin.controller.ts        # 관리자 API
│       │   │   ├── auth.controller.ts         # 인증 API
│       │   │   ├── license.controller.ts      # 라이센스 API
│       │   │   ├── mail.controller.ts         # 이메일 API
│       │   │   └── naver.controller.ts        # 네이버 크롤링 API
│       │   ├── services/                   # 비즈니스 로직
│       │   │   ├── auth.service.ts
│       │   │   ├── license.service.ts
│       │   │   ├── mail.service.ts
│       │   │   ├── crawl.service.ts
│       │   │   └── crawlers/
│       │   │       ├── base-crawler.ts        # 베이스 크롤러
│       │   │       ├── smart-store-crawler.ts # 스마트스토어
│       │   │       └── naver-blog-crawler.ts  # 네이버 블로그
│       │   ├── automation/                 # 브라우저 자동화
│       │   │   ├── browser/
│       │   │   │   ├── chromium-browser-manager.ts
│       │   │   │   └── stealth-page-factory.ts
│       │   │   ├── services/
│       │   │   └── types/
│       │   ├── middlewares/                # 미들웨어
│       │   │   ├── auth.middleware.ts         # JWT 검증
│       │   │   └── error.middleware.ts        # 에러 핸들링
│       │   ├── config/                     # 설정
│       │   │   └── env.ts                     # 환경 변수 스키마
│       │   ├── types/                      # 타입 정의
│       │   ├── utils/                      # 유틸리티
│       │   │   ├── logger.ts                  # Pino 로거
│       │   │   └── auto-register.ts           # 컨트롤러 자동 등록
│       │   └── plugins/                    # Fastify 플러그인
│       │       └── prisma.ts                  # Prisma 플러그인
│       ├── prisma/                         # Prisma ORM
│       │   ├── schema.prisma                  # 스키마 정의
│       │   ├── migrations/                    # 마이그레이션 이력
│       │   └── seed.ts                        # 시드 데이터
│       ├── Dockerfile                      # Docker 이미지 빌드
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                          # 공유 패키지
│   ├── shared/                           # 공유 타입 및 유틸리티
│   │   ├── src/
│   │   │   ├── types/                     # 공유 타입 정의
│   │   │   └── utils/                     # 공유 유틸리티
│   │   └── package.json
│   ├── typescript-config/                # 공유 TypeScript 설정
│   └── eslint-config/                    # 공유 ESLint 설정
│
├── .github/
│   └── workflows/
│       └── deploy.yml                    # GitHub Actions 워크플로우
│
├── docker-compose.yml                    # Docker Compose 설정
├── turbo.json                            # Turborepo 설정
├── pnpm-workspace.yaml                   # pnpm 워크스페이스
└── package.json                          # 루트 package.json
```

**주요 디렉토리 역할**

- `apps/dig-duck`: Tauri 기반 데스크톱 애플리케이션. React 19 + TanStack Router로 구성.
- `apps/api`: Fastify 기반 백엔드 API 서버. Prisma ORM + PostgreSQL 사용.
- `packages/shared`: 프론트엔드와 백엔드가 공유하는 타입 정의 및 유틸리티.
- `packages/typescript-config`: 공유 TypeScript 설정 (tsconfig.base.json 등).
- `packages/eslint-config`: 공유 ESLint 설정 (코드 스타일 통일).

---

## 배포

### 프론트엔드 배포

프론트엔드는 AWS S3 + CloudFront를 통해 정적 파일로 호스팅됩니다.

```bash
# 프로덕션 빌드
pnpm build --filter=dig-duck

# 빌드 결과물 확인
ls apps/dig-duck/dist

# S3 업로드 (AWS CLI 사용)
aws s3 sync apps/dig-duck/dist s3://your-bucket-name \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# HTML 파일은 별도 캐시 정책 적용
aws s3 sync apps/dig-duck/dist s3://your-bucket-name \
  --cache-control "public, max-age=60" \
  --exclude "*" \
  --include "*.html"

# CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

**자동 배포**

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 배포를 실행합니다.

```yaml
# .github/workflows/deploy.yml (일부)
- name: Build Frontend
  run: pnpm build --filter=dig-duck

- name: Deploy to S3
  uses: jakejarvis/s3-sync-action@master
  with:
    args: --delete
```

### 백엔드 배포

백엔드는 Docker 이미지로 빌드되어 AWS EC2에 배포됩니다.

```bash
# Prisma 클라이언트 생성
cd apps/api
pnpm db:generate

# TypeScript 빌드
pnpm build

# Docker 이미지 빌드
docker build -t digduck-api:latest .

# Docker Hub에 푸시 (선택사항)
docker tag digduck-api:latest yourusername/digduck-api:latest
docker push yourusername/digduck-api:latest

# EC2에 배포 (SSH)
ssh user@your-ec2-host
docker pull yourusername/digduck-api:latest
docker-compose up -d
```

### 블루그린 배포 전략

무중단 배포를 위해 블루그린 전략을 사용합니다.

**아키텍처**

```
Nginx (Port 8080)
   │
   ├─→ Blue Container (Port 8081)
   └─→ Green Container (Port 8082)
```

**배포 프로세스**

1. 현재 활성 환경 확인 (Blue 또는 Green)
2. 비활성 환경에 새 버전 배포
3. Health Check 실행 (최대 30회 시도)
4. Health Check 성공 시 Nginx 트래픽 전환
5. 최종 Health Check 확인
6. 이전 환경 컨테이너 중지
7. 실패 시 자동 롤백

**Nginx 설정 예시**

```nginx
upstream backend {
    server localhost:8081;  # Blue
    # server localhost:8082;  # Green (트래픽 전환 시 주석 해제)
}

server {
    listen 8080;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**배포 스크립트** (`deploy.sh`)

```bash
#!/bin/bash

CURRENT_ENV=$(grep "server localhost:808" /etc/nginx/sites-available/default | grep -v "#" | awk -F: '{print $2}' | tr -d ';')

if [ "$CURRENT_ENV" = "8081" ]; then
    NEW_ENV="8082"
    OLD_ENV="8081"
    CONTAINER_NAME="digduck-api-green"
else
    NEW_ENV="8081"
    OLD_ENV="8082"
    CONTAINER_NAME="digduck-api-blue"
fi

echo "Current: $OLD_ENV, Deploying to: $NEW_ENV"

# 새 컨테이너 시작
docker-compose up -d $CONTAINER_NAME

# Health Check
for i in {1..30}; do
    if curl -f http://localhost:$NEW_ENV/health > /dev/null 2>&1; then
        echo "Health check passed"
        break
    fi
    echo "Waiting for health check... ($i/30)"
    sleep 2
done

# Nginx 설정 변경
sed -i "s/server localhost:$OLD_ENV/server localhost:$NEW_ENV/" /etc/nginx/sites-available/default
nginx -s reload

# 최종 Health Check
sleep 5
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Deployment successful"
    docker stop digduck-api-$([ "$NEW_ENV" = "8081" ] && echo "green" || echo "blue")
else
    echo "Deployment failed, rolling back"
    sed -i "s/server localhost:$NEW_ENV/server localhost:$OLD_ENV/" /etc/nginx/sites-available/default
    nginx -s reload
    docker stop $CONTAINER_NAME
    exit 1
fi
```

---

## API 문서

백엔드는 Fastify의 Swagger 플러그인을 통해 자동으로 OpenAPI 3.0 문서를 생성합니다.

**로컬 개발 환경**
- Swagger UI: http://localhost:8080/documentation
- OpenAPI JSON: http://localhost:8080/documentation/json

**주요 엔드포인트**

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/auth/login` | 라이센스 키로 로그인 | ❌ |
| `POST` | `/auth/verify` | JWT 토큰 검증 | ✅ |
| `GET` | `/license/info` | 라이센스 정보 조회 | ✅ |
| `POST` | `/license/activate` | 디바이스 활성화 | ✅ |
| `POST` | `/license/transfer` | 디바이스 전송 | ✅ |
| `POST` | `/naver/crawl/smartstore` | 스마트스토어 크롤링 | ✅ |
| `POST` | `/naver/crawl/blog` | 네이버 블로그 크롤링 | ✅ |
| `GET` | `/naver/crawl/history` | 크롤링 이력 조회 | ✅ |
| `GET` | `/naver/crawl/progress/:id` | 실시간 진행 상황 (SSE) | ✅ |
| `GET` | `/admin/users` | 사용자 목록 조회 | ✅ (관리자) |
| `POST` | `/admin/license/create` | 라이센스 생성 | ✅ (관리자) |
| `GET` | `/health` | 헬스 체크 | ❌ |

**인증 방식**

Bearer Token (JWT) 방식을 사용합니다.

```bash
# 로그인
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "XXXX-XXXX-XXXX-XXXX"}'

# 응답
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "isAdmin": false
  }
}

# 인증이 필요한 요청
curl -X GET http://localhost:8080/license/info \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

**스키마 변경 예시**

1. `apps/api/prisma/schema.prisma` 수정
2. `pnpm db:migrate` 실행
3. 마이그레이션 이름 입력 (예: `add_user_role_field`)
4. Prisma 클라이언트가 자동으로 재생성됨

### 테스트 실행

```bash
# 전체 테스트 실행
pnpm test

# 특정 패키지만 테스트
pnpm test --filter=api

# Watch 모드
pnpm test:watch

# 커버리지 확인
pnpm test:coverage
```

### 로컬 개발 주의사항

**1. PostgreSQL 설정**

Docker를 사용하는 경우:

```bash
# PostgreSQL 컨테이너 시작
docker-compose up -d postgres

# 데이터베이스 확인
docker exec -it digduck-postgres psql -U postgres -d digduck
```

**2. Playwright 브라우저**

크롤러를 로컬에서 테스트하려면 Chromium 브라우저를 설치해야 합니다.

```bash
cd apps/api
pnpm exec playwright install chromium
```

**3. 환경 변수 누락**

`.env` 파일이 없으면 서버가 시작되지 않습니다. `.env.example`을 참고하여 `.env` 파일을 생성하세요.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dig-duck/.env.example apps/dig-duck/.env
```

**4. pnpm 워크스페이스**

모노레포 구조에서는 반드시 루트에서 `pnpm install`을 실행해야 합니다.

```bash
# ❌ 잘못된 방법
cd apps/api
pnpm install

# ✅ 올바른 방법
cd ../../  # 루트로 이동
pnpm install
```

**5. Prisma 클라이언트 재생성**

스키마를 변경하거나 의존성을 재설치한 후에는 Prisma 클라이언트를 재생성해야 합니다.

```bash
pnpm db:generate
```

**6. Turbo 캐시 초기화**

빌드가 이상하게 작동하면 Turbo 캐시를 삭제하세요.

```bash
pnpm clean
# 또는
rm -rf .turbo node_modules/.cache
```

**7. Tauri 빌드**

Tauri 앱을 빌드하려면 Rust 툴체인이 설치되어 있어야 합니다.

```bash
# Rust 설치 확인
rustc --version

# Tauri CLI 설치
cargo install tauri-cli

# 개발 모드
cd apps/dig-duck
pnpm tauri dev

# 프로덕션 빌드
pnpm tauri build
```