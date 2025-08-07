import pino from "pino";
import { env } from "@/config/env";

export const loggerConfig =
  env.NODE_ENV === "development"
    ? {
        level: env.LOG_LEVEL || "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "{emoji} {msg}",
          },
        },
      }
    : {
        level: env.LOG_LEVEL || "warn",
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      };

// 별도 사용을 위한 pino 인스턴스
export const logger = pino(loggerConfig);

export default logger;
