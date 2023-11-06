import { requestHash } from "./request.ts";
import { SerializedResponse, serializeResponse } from "./response.ts";

export interface CacheKvStore {
  set(
    key: string,
    value: SerializedResponse,
    option?: { expireIn: number },
  ): Promise<void>;
  get(key: string): Promise<{ value: SerializedResponse | undefined }>;
}

export class HttpCache {
  constructor(private kv: CacheKvStore) {}

  async set(req: Request, res: Response) {
    await this.kv.set(await requestHash(req), await serializeResponse(res), {
      expireIn: 1000 * 60 * 60 * 24 * 7,
    });
  }

  async get(req: Request) {
    const res = await this.kv.get(await requestHash(req));

    const raw = res.value;
    if (!raw) return null;

    if (
      raw.status == 101 || raw.status == 204 || raw.status == 205 ||
      raw.status == 304
    ) {
      return new Response(null, {
        headers: raw.headers,
        status: raw.status,
      });
    } else {
      return new Response(raw.body, {
        headers: raw.headers,
        status: raw.status,
      });
    }
  }
}
