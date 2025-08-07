import { FastifyInstance } from "fastify";
import { join } from "path";
import { autoRegisterControllers } from "@/utils/auto-register";

export const registerRoutes = async (app: FastifyInstance) => {
  // 컨트롤러 자동 등록
  await autoRegisterControllers(app, join(__dirname, "../controllers"));

  // Health check
  app.get("/health", async () => {
    return {
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "API",
      version: "1.0.0",
    };
  });

  // API info
  app.get("/", async () => {
    return {
      name: "Private API",
      version: "1.0.0",
      docs: "/docs",
    };
  });
};
