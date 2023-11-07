import { MiddlewareHandler } from "hono/mod.ts";
import { ignoreHeader } from "../cache/request.ts";

export const logHandler: MiddlewareHandler = (ctx, next) => {
  const url = new URL(ctx.req.raw.url);
  console.log(`[logHandler] ${ctx.req.method} - ${url.pathname + url.search}`);
  console.log(
    "[logHandler] [header]",
    ignoreHeader(Object.fromEntries(ctx.req.raw.headers)),
  );

  return next();
};
