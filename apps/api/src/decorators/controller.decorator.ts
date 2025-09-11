import "reflect-metadata";

export interface RouteOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  schema?: any;
  preHandler?: any[];
}

interface RouteMetadata {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  schema?: any;
  preHandler?: any[];
  handler: string;
  originalMethod: (...args: any[]) => any;
}

// 메타데이터 키
const ROUTES_KEY = Symbol("routes");
const CONTROLLER_KEY = Symbol("controller");

// Controller 데코레이터
export function Controller(prefix: string = "") {
  return function (target: any) {
    // 앞에 /가 없으면 자동으로 추가
    const normalizedPrefix = prefix.startsWith("/") ? prefix : `/${prefix}`;
    Reflect.defineMetadata(
      CONTROLLER_KEY,
      { prefix: normalizedPrefix },
      target,
    );
  };
}

// Route 데코레이터들
export function Route(options: RouteOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const routes = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
    routes.push({
      ...options,
      handler: propertyKey,
      originalMethod: descriptor.value,
    });
    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
  };
}

export function Get(
  path: string,
  options: Omit<RouteOptions, "method" | "path"> = {},
) {
  // 앞에 /가 없으면 자동으로 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Route({ method: "GET", path: normalizedPath, ...options });
}

export function Post(
  path: string,
  options: Omit<RouteOptions, "method" | "path"> = {},
) {
  // 앞에 /가 없으면 자동으로 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Route({ method: "POST", path: normalizedPath, ...options });
}

export function Put(
  path: string,
  options: Omit<RouteOptions, "method" | "path"> = {},
) {
  // 앞에 /가 없으면 자동으로 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Route({ method: "PUT", path: normalizedPath, ...options });
}

export function Delete(
  path: string,
  options: Omit<RouteOptions, "method" | "path"> = {},
) {
  // 앞에 /가 없으면 자동으로 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Route({ method: "DELETE", path: normalizedPath, ...options });
}

export function Patch(
  path: string,
  options: Omit<RouteOptions, "method" | "path"> = {},
) {
  // 앞에 /가 없으면 자동으로 추가
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return Route({ method: "PATCH", path: normalizedPath, ...options });
}

// Auth 데코레이터
export function Auth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const routes = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];

    const routeIndex = routes.findIndex(
      (route: RouteMetadata) => route.handler === propertyKey,
    );

    if (routeIndex !== -1) {
      routes[routeIndex].preHandler = routes[routeIndex].preHandler || [];
      routes[routeIndex].preHandler.push("authenticate");
    }

    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
  };
}

// 스키마 데코레이터
export function Schema(schema: any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const routes = Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];

    const routeIndex = routes.findIndex(
      (route: RouteMetadata) => route.handler === propertyKey,
    );

    if (routeIndex !== -1) {
      routes[routeIndex].schema = schema;
    }

    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
  };
}

// 컨트롤러 메타데이터 추출 함수들
export function getControllerMetadata(target: any) {
  return Reflect.getMetadata(CONTROLLER_KEY, target);
}

export function getRouteMetadata(target: any) {
  return Reflect.getMetadata(ROUTES_KEY, target) || [];
}
