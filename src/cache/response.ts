import { sha256 } from "../utils/sha256.ts";

export interface SerializedResponse {
  status: number;
  headers: Record<string, string>;
  body: ArrayBuffer;
}

export async function serializeResponse(
  res: Response,
): Promise<SerializedResponse> {
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers),
    body: await res.arrayBuffer(),
  };
}

export async function serializeResponseHash(
  res: SerializedResponse,
): Promise<string> {
  const headerHash = await sha256(
    new TextEncoder().encode(JSON.stringify(res.headers)),
  );
  const bodyHash = await sha256(res.body);

  return sha256(
    new TextEncoder().encode(`${res.status}:${headerHash}:${bodyHash}`),
  );
}
