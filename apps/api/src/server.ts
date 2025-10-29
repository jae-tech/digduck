import { build } from "./app";
import { env } from "./config/env";

const start = async () => {
  try {
    const app = await build();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API 서버가 http://${env.HOST}:${env.PORT} 에서 실행 중입니다`);

    // Graceful shutdown
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`${signal} 신호를 받았습니다. 서버를 종료합니다...`);
        try {
          await app.close();
          app.log.info("서버가 정상적으로 종료되었습니다");
          process.exit(0);
        } catch (err) {
          app.log.error("서버 종료 중 오류 발생:", err);
          process.exit(1);
        }
      });
    });
  } catch (err) {
    console.error("❌ 서버 시작 중 오류 발생:", err);
    process.exit(1);
  }
};

start();
