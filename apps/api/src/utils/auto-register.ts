import { FastifyInstance } from "fastify";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import {
  getControllerMetadata,
  getRouteMetadata,
} from "@/decorators/controller.decorator";

/**
 * Fastify 인스턴스에 컨트롤러를 자동으로 등록합니다.
 * @param app - Fastify 인스턴스
 * @param controllersPath - 컨트롤러 디렉토리 경로
 */
export async function autoRegisterControllers(
  app: FastifyInstance,
  controllersPath: string
) {
  const controllerFiles = getControllerFiles(controllersPath);

  for (const filePath of controllerFiles) {
    // CommonJS 환경에서 require 사용
    const module = require(filePath);

    // 모듈에서 클래스들 찾기
    for (const exportedItem of Object.values(module)) {
      if (typeof exportedItem === "function" && exportedItem.prototype) {
        const controllerMetadata = getControllerMetadata(exportedItem);

        if (controllerMetadata) {
          await registerController(app, exportedItem, controllerMetadata);
        }
      }
    }
  }
}

/**
 * 지정된 디렉토리에서 모든 컨트롤러 파일을 재귀적으로 가져옵니다.
 * @param dir - 컨트롤러 파일을 검색할 디렉토리
 * @returns 컨트롤러 파일 경로들의 배열
 */
function getControllerFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    const items = readdirSync(currentPath);

    for (const item of items) {
      const fullPath = join(currentPath, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (
        item.endsWith(".controller.ts") ||
        item.endsWith(".controller.js")
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Fastify 인스턴스에 컨트롤러를 등록합니다.
 * @param app - Fastify 인스턴스
 * @param ControllerClass - 등록할 컨트롤러 클래스
 * @param metadata - 컨트롤러 메타데이터
 */
async function registerController(
  app: FastifyInstance,
  ControllerClass: any,
  metadata: any
) {
  const routes = getRouteMetadata(ControllerClass);
  const instance = new ControllerClass();

  // 컨트롤러별 라우트 그룹 생성
  await app.register(
    async (fastify) => {
      for (const route of routes) {
        const routeOptions: any = {
          method: route.method,
          url: route.path,
          handler: instance[route.handler].bind(instance),
        };

        // 스키마 추가
        if (route.schema) {
          routeOptions.schema = route.schema;
        }

        // preHandler 추가
        if (route.preHandler && route.preHandler.length > 0) {
          routeOptions.preHandler = route.preHandler.map(
            (handlerName: string) => {
              if (handlerName === "authenticate") {
                return (fastify as any).authenticate;
              }
              return handlerName;
            }
          );
        }

        fastify.route(routeOptions);

        app.log.info(
          `Registered ${route.method} ${metadata.prefix}${route.path}`
        );
      }
    },
    { prefix: metadata.prefix }
  );
}
