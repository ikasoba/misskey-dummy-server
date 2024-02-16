import { Hono } from "hono/mod.ts";
import { inboxHandler } from "./inbox/inbox.ts";
import { Pinger } from "../../../utils/pinger.ts";
import { AppScheduler } from "../../app.ts";

export function activityPubHandler(
  pinger: Pinger,
  scheduler: AppScheduler,
  app: Hono,
) {
  inboxHandler(pinger, scheduler, app);
}
