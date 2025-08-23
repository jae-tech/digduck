import { spawn, ChildProcess } from "child_process";

export class PlaywrightMCPServer {
  private process?: ChildProcess;
  private isRunning = false;

  async start() {
    if (this.isRunning) return;

    try {
      // @playwright/mcp 서버 실행
      this.process = spawn("npx", ["@playwright/mcp"], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: process.cwd(),
      });

      this.process.stdout?.on("data", (data) => {
        console.log(`[Playwright MCP] ${data}`);
      });

      this.process.stderr?.on("data", (data) => {
        console.error(`[Playwright MCP Error] ${data}`);
      });

      this.process.on("exit", (code) => {
        console.log(`Playwright MCP server exited with code ${code}`);
        this.isRunning = false;
      });

      this.isRunning = true;
      console.log("🎭 Playwright MCP server started");
    } catch (error) {
      console.error("Failed to start Playwright MCP server:", error);
      throw error;
    }
  }

  async stop() {
    if (this.process && this.isRunning) {
      this.process.kill();
      this.isRunning = false;
      console.log("🎭 Playwright MCP server stopped");
    }
  }

  getStatus() {
    return {
      name: "playwright",
      running: this.isRunning,
      pid: this.process?.pid,
    };
  }
}
