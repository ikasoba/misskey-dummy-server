import { Hono } from "hono/mod.ts";
import { Pinger } from "../../../../utils/pinger.ts";
import {
  $ApCreate,
  $ApObject,
  ApCreate,
} from "../../activityStreams/Activity.ts";
import { AppScheduler, PROXY_HOST } from "../../../app.ts";
import { encodeBase64 } from "encoding/base64.ts";
import { ValidatorContext } from "../../../../utils/lizod.ts";

export class ApInbox {
  constructor(private pinger: Pinger, private scheduler: AppScheduler) {}

  async create(req: ApCreate): Promise<void> {
    // フォールバック用の処理は特にない
  }
}

export function inboxHandler(
  pinger: Pinger,
  scheduler: AppScheduler,
  app: Hono
) {
  const inbox = new ApInbox(pinger, scheduler);

  app.post("/inbox", async (ctx, next) => {
    const isHealthy = await pinger.healthy();

    // サーバーが生きていればそこを優先する
    if (isHealthy) return next();

    const url = new URL(ctx.req.url);
    const rawBody = await ctx.req.raw.clone().arrayBuffer();

    // さすがに大きいのは拒否
    if (rawBody.byteLength >= 1024 * 1024) {
      return ctx.text("request too large.", 413);
    }

    const body = await ctx.req.json<unknown>();
    let errors: ValidatorContext = { errors: [] };

    if ($ApObject(body, errors)) {
      // サーバーが復帰した頃にリクエストを投げる
      scheduler.schedule("request", "healthy", {
        method: ctx.req.method,
        url: new URL(url.pathname + url.search, PROXY_HOST).toString(),
        headers: Object.fromEntries(ctx.req.raw.headers),
        body: encodeBase64(rawBody),
      });
    } else {
      return ctx.text(
        `validation error:\n${errors.errors
          .map((x) => x.join("."))
          .join("\n")}`,
        400
      );
    }

    if ($ApCreate(body, (errors = { errors: [] }))) {
      // フォールバック用の処理
      inbox.create(body);
    }

    return ctx.text("", 202);
  });
}
