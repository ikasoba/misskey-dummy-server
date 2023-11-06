import * as dotenv from "dotenv/mod.ts";
await dotenv.load({
  export: true,
  envPath: ".env",
  examplePath: ".env-example",
});

await import("./src/serve.ts");
