 
/// <reference types="vite/client" />

declare module "virtual:generated-pages" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}

declare module "virtual:generated-pages-react" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}

// biar global types tetap aktif
declare global {
  type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;
  type ExclusiveOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
  type ToOptional<T> = { [P in keyof T]?: T[P] };
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
    };
  }
}

export {};
