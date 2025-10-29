# Dig Duck Desktop

Dig Duck 크롤링 플랫폼의 데스크톱 애플리케이션. Tauri와 React를 결합하여 네이티브 성능과 웹 기술의 장점을 모두 활용합니다.

[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.8-FFC131.svg)](https://tauri.app/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF.svg)](https://vitejs.dev/)

---

## 개요

Dig Duck Desktop은 네이버 스마트스토어와 블로그 크롤링을 위한 데스크톱 네이티브 애플리케이션입니다. 
Tauri를 사용하여 Rust의 성능과 보안을 활용하면서도, React의 풍부한 생태계를 통해 현대적인 UI/UX를 제공합니다.

웹 기반 크롤러보다 안정적인 환경에서 작동하며, 로컬 데이터 처리와 엑셀/PDF 내보내기 등의 네이티브 기능을 지원합니다.

---

## 기술 스택

**Core**
- **React 19.1** - 최신 React 버전
- **TypeScript 5.9** - 타입 안전성
- **Vite 7.1** - 빠른 빌드 도구
- **Tauri 2.8** - Rust 기반 크로스 플랫폼 데스크톱 앱

**Routing & State**
- **TanStack Router 1.131** - 타입 안전한 파일 기반 라우팅
- **TanStack Query 5.87** - 서버 상태 관리 및 캐싱
- **Zustand 5.0** - 경량 클라이언트 상태 관리

**UI & Styling**
- **Tailwind CSS 4.1** - 유틸리티 퍼스트 CSS
- **shadcn/ui** - Radix UI 기반 컴포넌트 라이브러리
- **Framer Motion 12.23** - 애니메이션
- **Lucide React** - 아이콘

**Data Visualization**
- **Chart.js 4.5** - 차트 라이브러리
- **React-ChartJS-2** - React 래퍼
- **TanStack Table 8.21** - 고급 데이터 테이블

**Utilities**
- **Axios** - HTTP 클라이언트
- **Zod** - 스키마 검증
- **date-fns** - 날짜 처리
- **html2canvas** & **jsPDF** - PDF 생성
- **XLSX** - 엑셀 파일 처리

---

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- pnpm 10.15 이상
- Rust 1.70 이상 (Tauri 빌드용)

**Rust 설치**

```bash
# Windows (PowerShell)
Invoke-WebRequest https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 설치

```bash
# 루트 디렉토리에서 의존성 설치
cd ../..
pnpm install
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 값을 설정하세요:

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

**프로덕션 환경** (`.env.production`)

```env
VITE_API_URL=https://api.digduck.app
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false
```

### 개발 서버 실행

```bash
# 웹 개발 모드
pnpm dev

# Tauri 데스크톱 앱 개발 모드
pnpm tauri dev
```

### 프로덕션 빌드

```bash
# 웹 빌드
pnpm build

# Tauri 데스크톱 앱 빌드
pnpm tauri build
# 빌드 결과: src-tauri/target/release/bundle/
```

---

## 프로젝트 구조

```
src/
├── main.tsx                        # 앱 진입점
│
├── routes/                         # TanStack Router 라우트
│   ├── __root.tsx                     # 루트 레이아웃
│   ├── index.tsx                      # 홈 페이지
│   ├── license.tsx                    # 라이센스 입력
│   └── _authenticated/                # 인증 필요 라우트
│       ├── admin/                        # 관리자 페이지
│       │   ├── dashboard.tsx                # 대시보드
│       │   └── license-manager.tsx          # 라이센스 관리
│       └── crawler/                      # 크롤러 페이지
│           ├── naver-blog.tsx               # 블로그 크롤러
│           ├── review.tsx                   # 리뷰 크롤러
│           └── insights.tsx                 # 인사이트
│
├── components/                     # 재사용 컴포넌트
│   ├── ui/                            # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layouts/                       # 레이아웃 컴포넌트
│   │   ├── AdminLayout.tsx
│   │   ├── UserLayout.tsx
│   │   ├── CenteredLayout.tsx
│   │   └── FluidLayout.tsx
│   └── icons/                         # 아이콘 컴포넌트
│
├── features/                       # 기능별 모듈
│   ├── crawler/                       # 크롤러 기능
│   │   ├── components/                   # 크롤러 컴포넌트
│   │   ├── hooks/                        # 크롤러 훅
│   │   ├── pages/                        # 크롤러 페이지
│   │   └── types/                        # 타입 정의
│   ├── license/                       # 라이센스 기능
│   ├── licenseManager/                # 라이센스 관리자 (관리자용)
│   ├── licenseGenerator/              # 라이센스 생성기 (관리자용)
│   └── admin/                         # 관리자 기능
│
├── lib/                            # 라이브러리
│   ├── apiClient.ts                   # Axios 인스턴스
│   └── utils.ts                       # 유틸리티 함수
│
├── config/                         # 설정
│   └── env.ts                         # 환경 변수
│
├── middleware/                     # 라우트 미들웨어
│   └── auth.middleware.ts             # 인증 체크
│
└── hooks/                          # 커스텀 훅
    └── usePlatform.ts                 # 플랫폼 감지

src-tauri/                          # Tauri (Rust)
├── src/
│   └── main.rs                        # Rust 메인 파일
├── Cargo.toml                         # Rust 의존성
├── tauri.conf.json                    # Tauri 설정
└── icons/                             # 앱 아이콘
```

---

## 주요 기능

### 라이센스 시스템

**라이센스 키 인증**
- 16자리 라이센스 키로 앱 활성화 (4-4-4-4 형식)
- 관리자 라이센스: `ADMIN-xxxx-xxxx-xxxx` 형식으로 구분
- 자동 만료 관리 및 알림
- JWT 토큰 기반 세션 관리

**디바이스 관리**
- localStorage에 토큰 저장
- 자동 로그인 (토큰 유효 시)
- 디바이스 ID 추적

### 크롤링 기능

**네이버 스마트스토어 크롤링**
- URL 또는 키워드 기반 상품 검색
- 실시간 진행 상황 표시 (SSE)
- 페이지 제한 설정 (최대 50페이지)
- 크롤링 결과 테이블로 표시

**네이버 블로그 크롤링**
- 블로그 포스트 자동 수집
- 키워드 기반 검색
- 크롤링 이력 관리

**데이터 관리**
- 엑셀(XLSX) 형식으로 내보내기
- PDF 형식으로 내보내기
- 차트 시각화 및 통계
- 사용자 정의 필터 및 검색

### 관리자 기능

**라이센스 관리**
- 라이센스 생성/조회/수정/삭제
- 사용자별 라이센스 정보 관리
- 구독 기간 관리
- 디바이스 전송 이력

**대시보드**
- 실시간 사용자 활동 모니터링
- 크롤링 통계
- 시스템 상태 확인

### UI/UX

**반응형 디자인**
- 데스크톱 최적화
- 다크 모드 지원 (예정)
- 접근성 고려 (키보드 네비게이션)

**애니메이션**
- Framer Motion을 통한 부드러운 전환
- 페이지 전환 애니메이션
- 로딩 스켈레톤

---

## 라우팅 구조

TanStack Router를 사용한 파일 기반 라우팅:

```
/ (index)                           # 홈 페이지
/license                            # 라이센스 입력
/_authenticated                     # 인증 필요 라우트
  /crawler/naver-blog               # 네이버 블로그 크롤러
  /crawler/review                   # 리뷰 크롤러
  /crawler/insights                 # 인사이트
  /admin/dashboard                  # 관리자 대시보드 (관리자만)
  /admin/license-manager            # 라이센스 관리 (관리자만)
```

**인증 미들웨어**

`_authenticated` 디렉토리 내의 모든 라우트는 자동으로 인증이 필요합니다. 토큰이 없거나 만료된 경우 `/license` 페이지로 리디렉션됩니다.

---

## 상태 관리

### Zustand (클라이언트 상태)

```typescript
// 사용자 상태
const useUserStore = create((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null })
}))
```

### TanStack Query (서버 상태)

```typescript
// 크롤링 이력 조회
const { data, isLoading } = useQuery({
  queryKey: ['crawlHistory'],
  queryFn: () => api.get('/naver/crawl/history')
})

// 크롤링 시작
const mutation = useMutation({
  mutationFn: (params) => api.post('/naver/crawl/smartstore', params),
  onSuccess: () => {
    queryClient.invalidateQueries(['crawlHistory'])
  }
})
```

---

## API 클라이언트

Axios 인스턴스로 API 통신:

```typescript
// lib/apiClient.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 (토큰 추가)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 (에러 핸들링)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃
      localStorage.removeItem('token')
      window.location.href = '/license'
    }
    return Promise.reject(error)
  }
)
```

---

## 개발 가이드

### 새 페이지 추가

1. `src/routes/` 디렉토리에 파일 생성

```typescript
// src/routes/_authenticated/example.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/example')({
  component: ExamplePage
})

function ExamplePage() {
  return <div>Example Page</div>
}
```

2. TanStack Router가 자동으로 라우트 등록

### 새 컴포넌트 추가

```bash
# shadcn/ui 컴포넌트 추가
npx shadcn-ui@latest add button

# 커스텀 컴포넌트 생성
src/components/MyComponent.tsx
```

### 환경별 빌드

```bash
# 개발 환경
pnpm build --mode development

# 프로덕션 환경
pnpm build --mode production
```

---

## Tauri 가이드

### Tauri 명령어

```bash
# Tauri CLI 설치
cargo install tauri-cli

# 개발 모드
pnpm tauri dev

# 프로덕션 빌드
pnpm tauri build

# 아이콘 생성
pnpm tauri icon path/to/icon.png
```

### Tauri 설정

`src-tauri/tauri.conf.json`에서 앱 설정:

```json
{
  "productName": "Dig Duck",
  "version": "1.0.0",
  "identifier": "com.digduck.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "tauri": {
    "windows": [
      {
        "title": "Dig Duck",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

### Rust 백엔드 활용

Tauri의 Rust 백엔드를 통해 네이티브 기능 호출:

```typescript
// src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/tauri'

// Rust 함수 호출
export async function saveFile(content: string) {
  return await invoke('save_file', { content })
}
```

```rust
// src-tauri/src/main.rs
#[tauri::command]
fn save_file(content: String) -> Result<(), String> {
  // 파일 저장 로직
  Ok(())
}
```

---

## 성능 최적화

**코드 스플리팅**
- TanStack Router의 자동 코드 스플리팅
- 라우트별 청크 분리
- 동적 import 활용

**이미지 최적화**
- 적절한 이미지 포맷 사용 (WebP)
- 지연 로딩 (Lazy Loading)
- 이미지 압축

**번들 최적화**
- Vite의 Tree Shaking
- 사용하지 않는 코드 제거
- 외부 라이브러리 CDN 활용 (선택사항)

---

## 배포

### 웹 배포 (AWS S3 + CloudFront)

GitHub Actions를 통한 자동 배포:

```bash
# main 브랜치 푸시 시 자동 배포
git push origin main
```

### 데스크톱 앱 배포

```bash
# 앱 빌드
pnpm tauri build

# 빌드 결과물
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/deb/
```

**릴리즈 프로세스**

1. 버전 업데이트 (`package.json`, `tauri.conf.json`)
2. 앱 빌드 (`pnpm tauri build`)
3. 빌드 결과물 테스트
4. GitHub Release 생성
5. 설치 파일 업로드

---

## 트러블슈팅

### Tauri 빌드 오류

**오류: Rust 컴파일러를 찾을 수 없음**

```bash
# Rust 설치 확인
rustc --version

# Rust 업데이트
rustup update
```

**오류: WebView2 누락 (Windows)**

Windows에서 Tauri 앱 실행 시 WebView2가 필요합니다:

```bash
# WebView2 설치
https://developer.microsoft.com/en-us/microsoft-edge/webview2/
```

### API 연결 오류

**.env 파일 확인**

```env
VITE_API_URL=http://localhost:8080  # 백엔드 서버 주소
```

**CORS 오류**

백엔드 API에서 CORS 설정 확인:

```env
# apps/api/.env
CORS_ORIGIN=http://localhost:1420
```