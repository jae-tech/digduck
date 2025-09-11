# Dig Duck - 네이버 스마트스토어 크롤링 솔루션

Dig Duck은 네이버 스마트스토어 상품 정보를 자동으로 수집하는 데스크톱 애플리케이션입니다.

## 🏗️ 프로젝트 구조

이 모노레포는 Turborepo를 사용하여 다음과 같이 구성되어 있습니다:

### 📱 애플리케이션

- **`apps/dig-duck`**: React + Tauri 데스크톱 애플리케이션
  - 네이버 스마트스토어 크롤링 UI
  - 라이센스 관리 시스템
  - 관리자 대시보드
- **`apps/api`**: Node.js + Fastify 백엔드 API
  - RESTful API 서버
  - 라이센스 검증 시스템
  - 크롤링 엔진 (Playwright)
  - 이메일 서비스 (Nodemailer)

### 🔧 개발 도구

- **TypeScript**: 전체 프로젝트 타입 안전성
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **Turborepo**: 모노레포 빌드 시스템
- **pnpm**: 패키지 관리자

## 🚀 빠른 시작

### 필요 조건

- Node.js 18+
- pnpm
- PostgreSQL (API용)
- Rust (Tauri 빌드용)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd personal-turborepo

# 의존성 설치
pnpm install

# 환경 변수 설정
cp apps/api/.env.example apps/api/.env
cp apps/dig-duck/.env.example apps/dig-duck/.env
# 각 .env 파일을 수정하여 필요한 값들 설정

# 데이터베이스 마이그레이션 (API용)
cd apps/api
pnpm db:migrate
cd ../..
```

### 개발 서버 실행

```bash
# 전체 개발 서버 시작
pnpm dev

# 또는 개별 실행
pnpm dev:api      # API 서버만
pnpm dev:app      # 프론트엔드만
```

### 빌드

```bash
# 전체 빌드
pnpm build

# 개별 빌드
pnpm build:api    # API 빌드
pnpm build:app    # 프론트엔드 빌드
```

## 📁 주요 기능

### 🔐 라이센스 시스템

- 16자리 라이센스 키 기반 인증
- 사용자/관리자 권한 구분
- 자동 만료 관리 및 알림

### 🕷️ 크롤링 엔진

- 네이버 스마트스토어 상품 정보 수집
- 실시간 진행률 표시
- 크롤링 결과 데이터베이스 저장

### 👨‍💼 관리자 기능

- 라이센스 발급 및 관리
- 사용자 통계 조회
- 크롤링 이력 관리

### 📧 이메일 시스템

- 라이센스 발급 시 자동 이메일 발송
- 템플릿 기반 이메일 관리
- Gmail/Outlook/SMTP 지원

## 🛠️ 사용 가능한 스크립트

### 전체 프로젝트

```bash
pnpm dev          # 전체 개발 서버 시작
pnpm build        # 전체 빌드
pnpm test         # 전체 테스트 실행
pnpm lint         # 전체 린트 실행
pnpm type-check   # TypeScript 타입 체크
```

### 개별 앱

```bash
# API 서버
pnpm dev:api      # API 개발 서버
pnpm build:api    # API 빌드
pnpm test:api     # API 테스트

# 프론트엔드
pnpm dev:app      # 프론트엔드 개발 서버
pnpm build:app    # 프론트엔드 빌드
pnpm tauri:dev    # Tauri 데스크톱 앱 개발
pnpm tauri:build  # Tauri 데스크톱 앱 빌드
```

## 🚀 배포

### 프론트엔드 (AWS S3 + CloudFront)

GitHub Actions를 통한 자동 배포:

```bash
# main 브랜치 푸시 시 자동 배포
git push origin main
```

### 백엔드 (Docker + EC2)

Docker 기반 블루그린 배포:

- PostgreSQL 17 자동 설정
- 무중단 배포 지원
- Health Check 및 자동 롤백

### 데스크톱 앱

```bash
# Tauri 애플리케이션 빌드
pnpm tauri:build

# 빌드된 파일 위치:
# apps/dig-duck/src-tauri/target/release/bundle/
```

## 🔒 보안

- JWT 토큰 기반 API 인증
- 라이센스 키 서버사이드 검증
- Rate Limiting 및 CORS 설정
- 환경별 설정 분리 (.env 파일)

## 📊 기술 스택

### Frontend (dig-duck)

- React 18 + TypeScript
- TanStack Router
- Tailwind CSS + shadcn/ui
- Zustand (상태 관리)
- Tauri (데스크톱)

### Backend (api)

- Node.js 18 + TypeScript
- Fastify 프레임워크
- PostgreSQL + Prisma ORM
- Playwright (크롤링)
- Nodemailer (이메일)
- JWT 인증

### DevOps

- GitHub Actions (CI/CD)
- Docker (컨테이너화)
- AWS S3 + CloudFront (정적 호스팅)
- EC2 (백엔드 서버)

## 📄 문서

각 애플리케이션의 상세 문서:

- [Frontend README](./apps/dig-duck/README.md)
- [Backend README](./apps/api/README.md)

## 📄 라이센스

이 프로젝트는 비공개 소유 프로젝트입니다.
