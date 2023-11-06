import { app } from "./app/app.ts";

Deno.serve(
  {
    port: parseInt(Deno.env.get("PORT") ?? "3000"),
  },
  app.fetch,
);
