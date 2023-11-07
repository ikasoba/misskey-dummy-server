import { Hono } from "hono/mod.ts";
import { Pinger } from "../utils/pinger.ts";
import { PROXY_HOST } from "./app.ts";
import { HttpCache } from "../cache/cache.ts";
import { FileStorage } from "../cache/FileStorage.ts";
import { logHandler } from "../utils/logHandler.ts";

try {
  await Deno.mkdir(".cache");
} catch {}

const proxyCache = new HttpCache(new FileStorage(".cache"));

export function proxyHandler(pinger: Pinger, app: Hono) {
  app.use("*", async (ctx) => {
    const isHealthy = await pinger.healthy();

    const url = new URL(ctx.req.raw.url);
    const isWs = ctx.req.header("upgrade") === "websocket";

    if (isWs) {
      if (isHealthy) {
        const { socket, response } = Deno.upgradeWebSocket(ctx.req.raw);

        const ws = new WebSocket(
          new URL(url.pathname + url.search, PROXY_HOST),
        );

        await Promise.all([
          new Promise<void>((resolve) => {
            socket.addEventListener("open", () => {
              resolve();
            });
          }),
          new Promise<void>((resolve) => {
            ws.addEventListener("open", () => {
              resolve();
            });
          }),
        ]);

        socket.addEventListener("message", (msg) => {
          ws.send(msg.data);
        });

        socket.addEventListener("close", (ev) => {
          try {
            ws.close(ev.code, ev.reason);
          } catch {
            ws.close();
          }
        });

        ws.addEventListener("message", (msg) => {
          socket.send(msg.data);
        });

        ws.addEventListener("close", (ev) => {
          try {
            socket.close(ev.code, ev.reason);
          } catch {
            socket.close();
          }
        });

        return response;
      } else {
        const { socket, response } = Deno.upgradeWebSocket(ctx.req.raw);

        setTimeout(
          () =>
            socket.close(
              undefined,
              JSON.stringify({ message: "ちょっとまってね。" }),
            ),
          1000 * 60 * 15,
        );

        return response;
      }
    }

    const request = new Request(
      new URL(url.pathname + url.search, PROXY_HOST),
      ctx.req.raw,
    );

    if (isHealthy) {
      const response = await pinger.fetch(request.clone());

      await proxyCache.set(request, response.clone());

      return response;
    }

    const cachedResponse = await proxyCache.get(request);
    if (cachedResponse) return cachedResponse;

    return ctx.text("ちょっとまってね。", 503);
  });
}
