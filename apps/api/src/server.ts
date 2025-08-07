import { build } from "./app";
import { env } from "./config/env";

const start = async () => {
  try {
    const app = await build();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`API Server ready at http://${env.HOST}:${env.PORT}`);

    // Graceful shutdown
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, closing server...`);
        try {
          await app.close();
          app.log.info("Server closed");
          process.exit(0);
        } catch (err) {
          app.log.error("Error closing server:", err);
          process.exit(1);
        }
      });
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
};

start();
