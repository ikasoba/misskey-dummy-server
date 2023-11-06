import { Hono } from "hono/mod.ts";
import { Pinger } from "../utils/pinger.ts";
import { proxyHandler } from "./proxy.ts";

export const PROXY_HOST = Deno.env.get("PROXY_HOST");
if (!PROXY_HOST) {
  throw new Error("environment variable PROXY_HOST is not defined.");
}

const pinger = new Pinger(PROXY_HOST);
export const app = new Hono();

proxyHandler(pinger, app);
