# 프로덕션 최적화를 위한 멀티 스테이지 빌드
FROM node:22-alpine AS base

# pnpm 설치
RUN corepack enable

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치 단계 - 캐싱 최적화
FROM base AS deps

# 캐시 레이어 최적화를 위한 패키지 파일 우선 복사
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./

# 의존성 해결을 위한 API package.json 복사
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# 패키지가 존재하면 복사
COPY packages/ ./packages/

# 빠른 빌드를 위한 캐시 마운트로 모든 의존성 설치
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 빌드 단계
FROM deps AS builder

# API 소스 코드 복사
COPY apps/api/ ./apps/api/

# Prisma 클라이언트 생성
WORKDIR /app/apps/api
RUN pnpm db:generate

# 애플리케이션 빌드
WORKDIR /app
RUN pnpm build --filter=api

# 프로덕션 단계 - 최소한의 최종 이미지
FROM node:22-alpine AS runner

# 적절한 시그널 처리를 위한 dumb-init 설치
RUN apk add --no-cache dumb-init

# 앱 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션에 필요한 pnpm 설치
RUN corepack enable

# 빌드된 파일들을 직접 복사
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./prisma/
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages/

# 프로덕션 의존성 설치
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --no-frozen-lockfile

# 빌드 단계에서 생성된 Prisma 클라이언트 복사
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# nodejs 사용자로 전환
USER nodejs

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

# 포트 노출 (동적으로 설정 가능)
EXPOSE 8000
EXPOSE 8001

# 헬스 체크 (환경 변수 PORT 사용)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "const port=process.env.PORT||8000; require('http').get(\`http://localhost:\${port}/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# 애플리케이션 시작
CMD ["dumb-init", "node", "apps/api/src/server.js"]