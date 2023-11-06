import { sha256 } from "../utils/sha256.ts";

export const ignoredHeader = new Set<string>([
  "dnt",
  "user-agent",
  "referer",
  "upgrade-insecure-requests",
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "content-length",
  "connection",
  "host",
  "origin",
  "cdn-loop",
]);

export const sortObject = <O extends object>(o: O): O =>
  Object.fromEntries(
    Object.entries(o).sort(([x], [y]) => x.charCodeAt(0) - y.charCodeAt(0)),
  ) as O;

export async function requestHash(req: Request) {
  const url = new URL(req.url);
  const urlHash = await sha256(
    new TextEncoder().encode(url.pathname + url.search),
  );

  let header = Object.fromEntries(
    [...req.headers].sort(([x], [y]) => x.charCodeAt(0) - y.charCodeAt(0)),
  );

  const contentType = header["content-type"];

  if (req.method == "GET") {
    header = {};
  }

  for (let key in header) {
    key = key.toLowerCase();

    if (
      key.startsWith("sec-") || key.startsWith("if-") ||
      key.startsWith("cf-") || key.startsWith("x-") || ignoredHeader.has(key)
    ) {
      delete header[key];
    }
  }

  header = sortObject(header);

  const headerHash = await sha256(
    new TextEncoder().encode(JSON.stringify(header)),
  );

  let bodyHash: string;
  if (contentType == "application/json") {
    const body = await req.json();
    bodyHash = await sha256(
      new TextEncoder().encode(JSON.stringify(sortObject(body))),
    );
  } else {
    bodyHash = await sha256(await req.arrayBuffer());
  }

  return await sha256(
    new TextEncoder().encode(`${urlHash}:${headerHash}:${bodyHash}`),
  );
}
