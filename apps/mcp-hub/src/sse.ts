import { FastifyInstance } from "fastify";

export class SSEManager {
  private connections: Map<string, any> = new Map();

  setupSSE(fastify: FastifyInstance) {
    // SSE 엔드포인트
    fastify.get("/sse", async (request, reply) => {
      const connectionId = `conn_${Date.now()}_${Math.random()}`;

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      // 연결 저장
      this.connections.set(connectionId, reply.raw);

      // 연결 확인 메시지
      this.sendMessage(connectionId, "connected", {
        connectionId,
        timestamp: new Date().toISOString(),
      });

      // Keep-alive
      const keepAlive = setInterval(() => {
        this.sendMessage(connectionId, "ping", {
          timestamp: new Date().toISOString(),
        });
      }, 30000);

      // 연결 종료 처리
      request.raw.on("close", () => {
        clearInterval(keepAlive);
        this.connections.delete(connectionId);
        console.log(`SSE connection ${connectionId} closed`);
      });

      reply.raw.on("error", (err) => {
        console.error(`SSE connection error for ${connectionId}:`, err);
        clearInterval(keepAlive);
        this.connections.delete(connectionId);
      });
    });

    // MCP 명령 수신 엔드포인트
    fastify.post("/mcp/command", async (request, reply) => {
      const { server, tool, args, connectionId } = request.body as {
        server: string;
        tool: string;
        args: any;
        connectionId?: string;
      };

      try {
        // MCP 명령 처리 (실제 구현은 필요에 따라)
        const result = {
          server,
          tool,
          args,
          result: `Executed ${tool} on ${server}`,
          timestamp: new Date().toISOString(),
        };

        // 특정 연결 또는 모든 연결에 결과 전송
        if (connectionId && this.connections.has(connectionId)) {
          this.sendMessage(connectionId, "mcp-result", result);
        } else {
          this.broadcast("mcp-result", result);
        }

        return { success: true, message: "Command sent" };
      } catch (error) {
        const errorResult = {
          server,
          tool,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        };

        if (connectionId && this.connections.has(connectionId)) {
          this.sendMessage(connectionId, "mcp-error", errorResult);
        } else {
          this.broadcast("mcp-error", errorResult);
        }

        return { success: false, error: (error as Error).message };
      }
    });
  }

  private sendMessage(connectionId: string, event: string, data: any) {
    const connection = this.connections.get(connectionId);
    if (connection && !connection.destroyed) {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.write(message);
    }
  }

  private broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [connectionId, connection] of this.connections.entries()) {
      if (!connection.destroyed) {
        connection.write(message);
      } else {
        this.connections.delete(connectionId);
      }
    }
  }

  getConnectionCount() {
    return this.connections.size;
  }
}
