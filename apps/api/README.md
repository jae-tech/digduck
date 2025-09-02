# Dig Duck API - 백엔드 서버

Dig Duck 프론트엔드를 지원하는 Node.js 기반 REST API 서버입니다.

## 📦 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT
- **Email**: Nodemailer (Gmail/Outlook/SMTP 지원)
- **Crawling**: Playwright
- **Validation**: Zod
- **Testing**: Vitest
- **Logging**: Custom Logger

## 🚀 시작하기

### 필요 조건

- Node.js 18+
- pnpm
- PostgreSQL 데이터베이스
- Docker (선택사항)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 후 데이터베이스 정보 입력

# 데이터베이스 마이그레이션
pnpm db:migrate

# 개발 서버 시작
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

### Docker 실행

```bash
# Docker 컨테이너 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f api
```

## 📁 프로젝트 구조

```
src/
├── controllers/          # API 컨트롤러
│   ├── admin.controller.ts       # 관리자 기능
│   ├── auth.controller.ts        # 인증
│   ├── license.controller.ts     # 라이센스 관리
│   ├── mail.controller.ts        # 이메일 발송
│   ├── naver.controller.ts       # 네이버 API
│   └── crawl-history.controller.ts # 크롤링 이력
├── services/             # 비즈니스 로직
│   ├── auth.service.ts           # 인증 서비스
│   ├── license.service.ts        # 라이센스 서비스
│   ├── mail.service.ts           # 이메일 서비스
│   ├── crawl.service.ts          # 크롤링 서비스
│   ├── mail-template.service.ts  # 이메일 템플릿
│   └── crawlers/                 # 크롤러 구현체
├── middlewares/          # 미들웨어
│   ├── auth.middleware.ts        # JWT 인증
│   ├── cors.middleware.ts        # CORS 설정
│   ├── error.middleware.ts       # 에러 핸들링
│   └── rate-limit.middleware.ts  # Rate Limiting
├── types/               # TypeScript 타입 정의
├── utils/               # 유틸리티 함수
├── config/              # 설정 파일
├── external/            # 외부 API 클라이언트
└── automation/          # 자동화 스크립트
```

## 🔧 환경 설정

### 환경 변수

`.env` 파일에 다음 값들을 설정하세요:

```env
# 서버 설정
NODE_ENV=development
PORT=8080
HOST=0.0.0.0

# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/digduck

# JWT 설정
JWT_SECRET=your-jwt-secret-key-32-chars-min
JWT_EXPIRES_IN=7d

# 보안 설정
BCRYPT_SALT_ROUNDS=12
LICENSE_SALT=your-license-salt-key-16-chars-min

# CORS 및 Rate Limiting
CORS_ORIGIN=https://digduck.app
RATE_LIMIT_MAX=100

# 네이버 API
NAVER_LOGIN_ID=your-naver-client-id
NAVER_LOGIN_PASSWORD=your-naver-client-secret

# 이메일 서비스 (선택사항)
MAIL_FROM=hello@digduck.app
MAIL_PROVIDER=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false

# 기타
LOG_LEVEL=debug
PRODUCT_NAME=DigDuck
CLIENT_URL=https://digduck.app
COMPANY_NAME=DigDuck
```

## 📱 주요 기능

### 🔐 인증 시스템
- **JWT 토큰 기반 인증**: 액세스 토큰으로 API 보호
- **라이센스 키 검증**: 16자리 라이센스 키로 사용자 인증
- **사용자/관리자 구분**: ADMIN 접두사 기반 권한 관리
- **자동 만료 처리**: 라이센스 만료일 자동 체크

### 🕷️ 크롤링 엔진
- **네이버 스마트스토어 크롤링**: Playwright 기반 상품 정보 수집
- **실시간 진행률**: WebSocket을 통한 크롤링 상태 실시간 전송
- **크롤링 이력 관리**: 크롤링 결과 데이터베이스 저장
- **에러 핸들링**: 크롤링 실패 시 자동 재시도 및 에러 로깅

### 👨‍💼 라이센스 관리
- **라이센스 생성**: 관리자용 라이센스 키 생성 API
- **라이센스 조회**: 사용자별 라이센스 정보 관리
- **자동 이메일 발송**: 라이센스 생성 시 자동 이메일 전송
- **만료 알림**: 라이센스 만료 예정 시 알림 이메일

### 📧 이메일 시스템
- **템플릿 기반**: 미리 정의된 이메일 템플릿 사용
- **다중 프로바이더**: Gmail, Outlook, SMTP 지원
- **변수 치환**: 동적 콘텐츠 생성
- **이메일 이력**: 발송 이력 추적 및 관리

### 📊 API 문서화
- **Swagger/OpenAPI**: 자동 생성된 API 문서
- **타입 안전성**: Zod 스키마 기반 요청/응답 검증
- **에러 응답**: 표준화된 에러 응답 형식

## 🔗 API 엔드포인트

### 인증
```
POST /auth/login          # 라이센스 키 로그인
POST /auth/verify         # 토큰 검증
GET  /auth/me            # 현재 사용자 정보
```

### 라이센스
```
POST /licenses           # 라이센스 생성 (관리자)
GET  /licenses           # 라이센스 목록 조회 (관리자)
GET  /licenses/:id       # 특정 라이센스 조회
PUT  /licenses/:id       # 라이센스 수정 (관리자)
DELETE /licenses/:id     # 라이센스 삭제 (관리자)
```

### 크롤링
```
POST /crawl/start        # 크롤링 시작
GET  /crawl/status       # 크롤링 상태 조회
GET  /crawl/history      # 크롤링 이력 조회
GET  /crawl/results/:id  # 크롤링 결과 조회
```

### 이메일
```
POST /mail/send          # 이메일 발송
POST /mail/send-template # 템플릿 이메일 발송
GET  /mail/templates     # 템플릿 목록 조회
POST /mail/configure     # 이메일 설정
```

### 관리자
```
GET  /admin/dashboard    # 대시보드 데이터
GET  /admin/users        # 사용자 목록
GET  /admin/stats        # 통계 정보
```

## 🧪 테스트

```bash
# 전체 테스트 실행
pnpm test

# 특정 파일 테스트
pnpm test auth.test.ts

# 테스트 커버리지
pnpm test:coverage

# Watch 모드
pnpm test:watch
```

## 🚀 배포

### Docker 배포

```bash
# 이미지 빌드
docker build -t dig-duck-api .

# 컨테이너 실행
docker run -d \
  --name dig-duck-api \
  -p 8080:8080 \
  --env-file .env \
  dig-duck-api
```

### GitHub Actions 자동 배포

`main` 브랜치 푸시 시 자동으로 EC2에 배포됩니다:

- **블루그린 배포**: 무중단 배포 지원
- **Health Check**: 배포 후 서비스 상태 확인
- **자동 롤백**: 배포 실패 시 이전 버전으로 롤백
- **PostgreSQL 자동 설정**: 컨테이너 기반 데이터베이스 관리

## 🔒 보안

- **JWT 토큰 인증**: 모든 API 요청 보안
- **Rate Limiting**: API 남용 방지
- **CORS 설정**: 허용된 도메인만 접근 가능
- **입력 검증**: Zod를 통한 엄격한 데이터 검증
- **SQL Injection 방지**: Prisma ORM 사용
- **환경 변수 관리**: 민감한 정보 환경 변수로 관리

## 📊 모니터링

- **구조화된 로깅**: JSON 형태의 로그 출력
- **에러 추적**: 상세한 에러 정보 기록
- **성능 메트릭**: API 응답 시간 측정
- **Health Check 엔드포인트**: `/health` 경로 제공

## 🛠️ 개발 도구

### 사용 가능한 스크립트

```bash
pnpm dev          # 개발 서버 시작 (Hot Reload)
pnpm build        # TypeScript 빌드
pnpm start        # 프로덕션 서버 시작
pnpm test         # 테스트 실행
pnpm db:migrate   # 데이터베이스 마이그레이션
pnpm db:seed      # 시드 데이터 생성
pnpm db:reset     # 데이터베이스 리셋
pnpm lint         # ESLint 실행
pnpm type-check   # TypeScript 타입 체크
```

### 개발 환경 설정

```bash
# 데이터베이스 초기화
pnpm db:reset

# 시드 데이터 생성
pnpm db:seed

# 개발 서버 시작 (자동 재시작)
pnpm dev
```

## 📄 라이센스

이 프로젝트는 비공개 소유 프로젝트입니다.