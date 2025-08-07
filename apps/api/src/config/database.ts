// apps/api/src/config/database.ts
import { FastifyInstance } from "fastify";
import { env } from "./env";

export const setupDatabase = async (app: FastifyInstance) => {
  try {
    // 데이터베이스 연결 테스트
    await app.pg.query("SELECT NOW()");
    app.log.info("✅ PostgreSQL connected successfully");
  } catch (error) {
    app.log.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// 데이터베이스 연결 풀 설정 확인
export const getDatabaseInfo = async (app: FastifyInstance) => {
  try {
    const result = await app.pg.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version
    `);
    return result.rows[0];
  } catch (error) {
    app.log.error("Failed to get database info:", error);
    throw error;
  }
};

// 데이터베이스 헬스체크
export const checkDatabaseHealth = async (app: FastifyInstance) => {
  try {
    const start = Date.now();
    await app.pg.query("SELECT 1");
    const duration = Date.now() - start;

    return {
      status: "healthy",
      response_time_ms: duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};
