import { FastifyInstance } from "fastify";

export class DatabaseService {
  constructor(private app: FastifyInstance) {}

  async getHealth() {
    try {
      const start = Date.now();
      await this.app.pg.query("SELECT 1");
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
  }

  async getInfo() {
    try {
      const result = await this.app.pg.query(`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version
      `);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get database info: ${error}`);
    }
  }

  async runMigration(sql: string) {
    try {
      await this.app.pg.query(sql);
      return { success: true };
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }
}
