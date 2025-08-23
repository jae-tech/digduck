import Fastify from "fastify";
import cors from "@fastify/cors";
import { PlaywrightMCPServer } from "./servers/playwright.js";
import { SSEManager } from "./sse.js";

const fastify = Fastify({
  logger: {
    level: "info",
  },
});

await fastify.register(cors);

// MCP 서버 인스턴스들
const playwrightServer = new PlaywrightMCPServer();

// SSE 매니저
const sseManager = new SSEManager();
sseManager.setupSSE(fastify);

// Health check
fastify.get("/health", async () => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    servers: {
      playwright: playwrightServer.getStatus(),
    },
    connections: sseManager.getConnectionCount(),
  };
});

// MCP 서버 상태
fastify.get("/servers/status", async () => {
  return {
    servers: [playwrightServer.getStatus()],
  };
});

const start = async () => {
  try {
    // MCP 서버들 시작
    await playwrightServer.start();

    await fastify.listen({ port: 8080, host: "0.0.0.0" });

    console.log("🚀 MCP Hub running on http://localhost:8080");
    console.log("📡 SSE endpoint: http://localhost:8080/sse");
    console.log("📊 Health check: http://localhost:8080/health");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down MCP Hub...");
  await playwrightServer.stop();
  await fastify.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
