# Dig-Duck

네이버 스마트스토어 상품 가격을 자동으로 크롤링하고 마진을 계산하는 SaaS 애플리케이션입니다.

## 개요
스마트스토어 상품가격을 자동으로 크롤링하고 마진을 계산하는 SaaS입니다.  
실제 상용화는 네이버 봇 탐지 정책으로 인해 중단되었지만,  
크롤링 엔진 설계부터 AWS CloudFront 배포, 블루/그린 전략까지 직접 구현하며  
실무 수준의 인프라 설계 경험을 쌓았습니다.  
또한 **독립 도메인 구매 및 이메일 DNS(MX/SPF/DKIM) 설정을 완료하고,  
도메인 연결 및 메일 송수신 테스트까지 진행**하여  
실제 운영 환경 수준의 인프라 구성을 검증했습니다.

**주요 기능**
- Playwright 기반 가격 크롤링 (봇 탐지 우회)
- 실시간 크롤링 진행 상황 스트리밍 (SSE)
- 쿠폰 및 마진 계산기
- 라이센스 기반 디바이스 관리 시스템
- Tauri 데스크톱 앱으로 로컬 실행

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Tauri Desktop App (React + TypeScript)             │   │
│  │                                                              │   │
│  │  TanStack Router ─→ TanStack Query ─→ Zustand Store          │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                   HTTPS/JWT Authentication
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Layer                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Fastify API Server (Node.js)                    │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐      │   │
│  │  │   Auth      │  │  License    │  │   Crawl          │      │   │
│  │  │ Controller  │  │ Controller  │  │  Controller      │      │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘      │   │
│  │         │                │                  │                │   │
│  │         ▼                ▼                  ▼                │   │ 
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐      │   │
│  │  │   Auth      │  │  License    │  │   Crawl          │      │   │
│  │  │  Service    │  │  Service    │  │  Service         │      │   │
│  │  └─────────────┘  └─────────────┘  └────────┬─────────┘      │   │
│  │                                              │               │   │
│  │                                              ▼               │   │
│  │                           ┌──────────────────────────────┐   │   │
│  │                           │   Playwright Engine          │   │   │
│  │                           │  (Stealth Browser Automation)│   │   │
│  │                           │                              │   │   │
│  │                           │  - User-Agent Spoofing       │   │   │
│  │                           │  - Mouse Movement Simulation │   │   │
│  │                           │  - Random Delays             │   │   │
│  │                           │  - Anti-Detection Features   │   │   │
│  │                           └──────────────┬───────────────┘   │   │
│  │                                          │                   │   │
│  │                                  SSE Stream (Progress)       │   │
│  │                                          │                   │   │
│  └──────────────────────────────────────────┼───────────────────┘   │
└─────────────────────────────────────────────┼───────────────────────┘
                                              │
                              Crawled Data / Auth Data
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Layer                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Prisma ORM                                │   │
│  │                                                              │   │
│  │  Type-safe DB Client ─→ Schema Validation ─→ Migration       │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database (v17)                       │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │   │
│  │  │   users      │  │ licenseUsers │  │  crawlHistory    │    │   │  
│  │  ├──────────────┤  ├──────────────┤  ├──────────────────┤    │   │
│  │  │ crawlItems   │  │ deviceTrans  │  │  mailHistory     │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                 ┌─────────────────────────────┐
                 │   External Services         │
                 │                             │
                 │  - Naver SmartStore (Target)│
                 │  - Email Service (Zoho Mail)│
                 │  - AWS S3 + CloudFront      │
                 └─────────────────────────────┘
```

본 시스템은 Tauri 기반 데스크톱 클라이언트와 Fastify API 서버로 구성된 3-Tier 아키텍처로 설계되었습니다. 클라이언트는 JWT 토큰을 통해 인증 후 API와 통신하며, 크롤링 요청 시 Playwright Stealth Engine이 실제 브라우저를 제어하여 네이버 스마트스토어에서 데이터를 수집합니다. 수집된 데이터는 Prisma ORM을 통해 PostgreSQL에 저장되며, SSE(Server-Sent Events)를 통해 클라이언트에 실시간 진행 상황이 스트리밍됩니다. 라이센스 관리, 디바이스 인증, 이메일 알림 등의 부가 기능은 독립적인 서비스 레이어로 분리되어 모듈성과 유지보수성을 확보했습니다.

## 기술 스택

**Frontend**
- React 19.1 + Vite 7.1
- Tailwind CSS 4.1 + shadcn/ui
- Tauri 2.8 (Rust 기반 데스크톱 앱)
- TanStack Router 1.131 + TanStack Query 5.87
- Zustand 5.0 (상태 관리)

**Backend**
- Fastify 5.5 (Node.js 웹 프레임워크)
- Prisma 6.15 + PostgreSQL 17
- Playwright 1.55 (브라우저 자동화)
- Zod 4.1 (타입 검증)

**Infrastructure**
- Turborepo 2.5 (모노레포 빌드 시스템)
- pnpm 10.15 (패키지 매니저)
- Docker + GitHub Actions (CI/CD)
- AWS EC2 + S3 + CloudFront

## 설치 및 실행

### 필수 요구사항

- Node.js 18 이상
- pnpm 10.15 이상
- PostgreSQL 17 이상
- Rust 1.70 이상 (Tauri 빌드용)

### 설치

```bash
# 저장소 클론
git clone https://github.com/jae-tech/digduck.git
cd digduck

# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install

# Playwright 브라우저 설치
cd apps/api
pnpm exec playwright install chromium
cd ../..
```

### 환경 변수 설정

**Backend** (`apps/api/.env`)

```bash
# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/digduck

# JWT 인증
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# 네이버 로그인 (크롤러용)
NAVER_LOGIN_ID=your_naver_id
NAVER_LOGIN_PASSWORD=your_naver_password

# 이메일 서비스 (Zoho Mail)
MAIL_PROVIDER=zoho
MAIL_USER=your_email@zohomail.com
MAIL_PASS=your_app_password
```

**Frontend** (`apps/dig-duck/.env`)

```bash
# API 엔드포인트
VITE_API_URL=http://localhost:8080
```

### 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 마이그레이션 실행
cd apps/api
pnpm db:migrate

# 시드 데이터 생성 (선택사항)
pnpm db:seed
```

### 개발 서버 실행

```bash
# 전체 앱 실행 (프론트엔드 + 백엔드)
pnpm dev

# 개별 실행
pnpm dev --filter=api        # 백엔드만 (http://localhost:8080)
pnpm dev --filter=dig-duck   # 프론트엔드만 (http://localhost:1420)
```

### 빌드

```bash
# 전체 빌드
pnpm build

# Tauri 데스크톱 앱 빌드
cd apps/dig-duck
pnpm tauri:build
```

## 배포

### Docker 배포

```bash
# Docker 이미지 빌드
docker build -t digduck-api ./apps/api
docker build -t digduck-web ./apps/dig-duck

# 컨테이너 실행
docker run -p 8080:8080 --env-file apps/api/.env digduck-api
```

### AWS 배포

**백엔드 (EC2)**

```bash
# GitHub Actions를 통한 자동 배포
# .github/workflows/deploy-api.yml 참조

# 수동 배포
ssh ec2-user@your-ec2-instance
cd /var/www/digduck
git pull origin main
pnpm install
pnpm build --filter=api
pm2 restart digduck-api
```

**프론트엔드 (S3 + CloudFront)**

```bash
# 프론트엔드 빌드 및 S3 업로드
cd apps/dig-duck
pnpm build
aws s3 sync dist/ s3://your-bucket-name --delete

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 블루그린 배포

```bash
# 새 버전 컨테이너 시작
docker-compose up -d digduck-api-green

# Health check 확인
curl http://localhost:8081/health

# Nginx 트래픽 전환
# /etc/nginx/conf.d/digduck.conf 수정 후
sudo nginx -s reload

# 기존 버전 중단
docker-compose stop digduck-api-blue
```

## 프로젝트 구조

```
digduck/
├── apps/
│   ├── api/                      # Fastify 백엔드
│   │   ├── src/
│   │   │   ├── automation/       # Playwright 크롤러
│   │   │   ├── controllers/      # API 컨트롤러
│   │   │   ├── services/         # 비즈니스 로직
│   │   │   ├── middleware/       # JWT 인증 등
│   │   │   └── server.ts         # 서버 진입점
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # DB 스키마
│   │   │   └── migrations/       # 마이그레이션 파일
│   │   └── package.json
│   └── dig-duck/                 # React + Tauri 프론트엔드
│       ├── src/
│       │   ├── routes/           # TanStack Router 라우트
│       │   ├── components/       # React 컴포넌트
│       │   ├── stores/           # Zustand 스토어
│       │   ├── lib/              # 유틸리티 함수
│       │   └── main.tsx          # 앱 진입점
│       ├── src-tauri/            # Rust 백엔드
│       │   └── src/
│       │       └── main.rs       # Tauri 진입점
│       └── package.json
├── packages/
│   ├── shared/                   # 공유 타입 및 스키마
│   ├── ui/                       # 공유 UI 컴포넌트
│   ├── eslint-config/            # ESLint 설정
│   └── typescript-config/        # TypeScript 설정
├── turbo.json                    # Turborepo 설정
├── pnpm-workspace.yaml           # pnpm 워크스페이스
└── package.json
```

## 트러블슈팅

### Prisma 마이그레이션 실패

**문제:** `prisma migrate deploy` 실행 시 "Connection refused" 에러

```bash
Error: P1001: Can't reach database server at `localhost:5432`
```

**해결방법:**

1. PostgreSQL이 실행 중인지 확인

```bash
# Windows
sc query postgresql-x64-17

# Linux/Mac
sudo systemctl status postgresql
```

2. DATABASE_URL 환경 변수 확인

```bash
echo $DATABASE_URL
```

3. 방화벽 확인 (포트 5432 개방 필요)

### Playwright 브라우저 미설치

**문제:** 크롤링 실행 시 "Executable doesn't exist" 에러

```bash
browserType.launch: Executable doesn't exist at /path/to/chromium
```

**해결방법:**

```bash
cd apps/api
pnpm exec playwright install chromium
```

### Node 버전 불일치

**문제:** 빌드 실패 - "Unsupported engine"

```bash
error @tauri-apps/cli@2.8.4: The engine "node" is incompatible
```

**해결방법:**

1. Node.js 버전 확인

```bash
node --version
```

2. nvm으로 버전 변경

```bash
nvm install 18
nvm use 18
```

### CloudFront 캐시 무효화 실패

**문제:** AWS CLI 자격 증명 오류

```bash
Unable to locate credentials. You can configure credentials by running "aws configure"
```

**해결방법:**

1. AWS CLI 설정

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: ap-northeast-2
```

2. 환경 변수로 설정 (GitHub Actions 등)

```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### GitHub Actions 권한 오류

**문제:** CI/CD 파이프라인에서 EACCES 에러

```bash
EACCES: permission denied, mkdir '/github/workspace/node_modules'
```

**해결방법:**

1. GitHub Actions workflow 파일에 권한 추가

```yaml
jobs:
  build:
    permissions:
      contents: write
      packages: write
```

2. pnpm 캐시 경로 수정

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.15
    run_install: false
```

### Tauri 빌드 실패 (Windows)

**문제:** Rust 툴체인 또는 WebView2 누락

```bash
error: linker `link.exe` not found
```

**해결방법:**

1. Rust 설치

```bash
winget install Rustlang.Rustup
```

2. Visual Studio Build Tools 설치 (C++ 빌드 도구 포함)

3. WebView2 Runtime 설치

```bash
winget install Microsoft.EdgeWebView2Runtime
```