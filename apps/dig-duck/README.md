# Dig Duck - 네이버 스마트스토어 크롤링 툴

Dig Duck은 네이버 스마트스토어 상품 정보를 크롤링하는 데스크톱 애플리케이션입니다.

## 📦 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router  
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Custom API Client
- **Desktop**: Tauri (크로스 플랫폼)

## 🚀 시작하기

### 필요 조건

- Node.js 18+
- pnpm
- Rust (Tauri 빌드용)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 미리보기
pnpm preview
```

### Tauri 데스크톱 앱

```bash
# Tauri 개발 모드
pnpm tauri dev

# Tauri 앱 빌드
pnpm tauri build
```

## 📁 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── layouts/         # 레이아웃 컴포넌트
│   └── icons/           # 아이콘 컴포넌트
├── features/            # 기능별 모듈
│   ├── crawler/         # 크롤링 기능
│   ├── license/         # 라이센스 관리
│   ├── licenseManager/  # 라이센스 관리자 (관리자용)
│   ├── licenseGenerator/ # 라이센스 생성기 (관리자용)
│   └── admin/           # 관리자 대시보드
├── lib/                 # 유틸리티 라이브러리
├── config/              # 환경 설정
├── middleware/          # 미들웨어 (인증 등)
└── routes/              # TanStack Router 라우트
    ├── _authenticated/  # 인증이 필요한 라우트
    │   ├── admin/      # 관리자 전용 라우트
    │   └── crawler.tsx  # 크롤러 메인 페이지
    ├── license.tsx      # 라이센스 입력 페이지
    └── index.tsx        # 홈 페이지
```

## 🔧 환경 설정

### 환경 변수

환경별 `.env` 파일:

```bash
# .env (개발환경 기본값)
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true

# .env.production (프로덕션)
VITE_API_URL=https://api.digduck.app
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false
```

## 📱 주요 기능

### 🔐 라이센스 시스템
- **라이센스 키 인증**: 16자리 라이센스 키로 앱 활성화
- **사용자/관리자 구분**: ADMIN 접두사로 관리자 권한 구분
- **자동 만료 관리**: 라이센스 만료일 자동 체크

### 🕷️ 크롤링 기능
- **네이버 스마트스토어 크롤링**: 상품 정보 자동 수집
- **실시간 진행률 표시**: 크롤링 진행 상황 실시간 모니터링
- **결과 데이터 표시**: 수집된 상품 정보를 테이블 형태로 표시

### 👨‍💼 관리자 기능
- **라이센스 관리**: 라이센스 발급, 조회, 수정, 삭제
- **라이센스 생성**: 새로운 라이센스 키 생성
- **사용자 관리**: 라이센스별 사용자 정보 관리

### 📱 반응형 디자인
- **모바일 최적화**: 작은 화면에서도 사용하기 편한 UI
- **라이센스 입력 필드**: 모바일에서 2줄로 나누어 표시
- **적응형 레이아웃**: 화면 크기에 따른 자동 레이아웃 조정

## 🛠️ 개발 가이드

### 코드 스타일

- **함수형 컴포넌트**: React hooks 사용
- **TypeScript**: 엄격한 타입 체크
- **컴포넌트 기반**: 재사용 가능한 컴포넌트 설계
- **Tailwind CSS**: 유틸리티 클래스 기반 스타일링

### 사용 가능한 스크립트

```bash
pnpm dev          # 개발 서버 시작
pnpm build        # 프로덕션 빌드
pnpm preview      # 프로덕션 빌드 미리보기
pnpm tauri dev    # Tauri 개발 모드
pnpm tauri build  # Tauri 애플리케이션 빌드
```

## 🚀 배포

### 웹 배포 (AWS S3 + CloudFront)

GitHub Actions를 통한 자동 배포:

```bash
# main 브랜치 푸시 시 자동 배포
git push origin main
```

### 데스크톱 앱 빌드

```bash
pnpm tauri build
# 빌드된 실행 파일: src-tauri/target/release/bundle/
```

## 🔒 보안

- **라이센스 검증**: 서버 사이드 라이센스 유효성 검사
- **인증 미들웨어**: 보호된 라우트 접근 제어
- **환경별 설정**: 개발/프로덕션 환경 분리

## 📄 라이센스

이 프로젝트는 비공개 소유 프로젝트입니다.