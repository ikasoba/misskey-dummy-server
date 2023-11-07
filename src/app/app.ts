import { Hono } from "hono/mod.ts";
import { Pinger } from "../utils/pinger.ts";
import { proxyHandler } from "./proxy.ts";
import { activityPubHandler } from "./mock/acitivtyPub/index.ts";
import { Scheduler } from "../scheduler/Scheduler.ts";
import { createRequester } from "../utils/request.ts";
import { logHandler } from "../utils/logHandler.ts";

const _PROXY_HOST = Deno.env.get("PROXY_HOST");
if (!_PROXY_HOST) {
  throw new Error("environment variable PROXY_HOST is not defined.");
}

export const PROXY_HOST = _PROXY_HOST;

const MINUTE_PER_REQUEST = parseFloat(
  Deno.env.get("MINUTE_PER_REQUEST") ?? "6",
);

export type AppScheduler = typeof appScheduler;

const pinger = new Pinger(PROXY_HOST);

const appScheduler = new Scheduler(
  ".scheduler/schedules.json",
  {},
  MINUTE_PER_REQUEST,
)
  .defineEvent("healthy")
  .defineTask("request", createRequester(pinger.fetch.bind(pinger)));

pinger.onStatusHealthy.add(() => {
  appScheduler.dispatch("healthy");
});

export const app = new Hono();

app.use("*", logHandler);

activityPubHandler(pinger, appScheduler, app);
proxyHandler(pinger, app);
