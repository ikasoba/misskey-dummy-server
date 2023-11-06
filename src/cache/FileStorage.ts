import { CacheKvStore } from "./cache.ts";
import { SerializedResponse } from "./response.ts";
import { join } from "path/mod.ts";

export interface StorageInfo {
  [id: string]: {
    status: SerializedResponse["status"];
    headers: SerializedResponse["headers"];
    createdAt: number;
    expireIn?: number;
  };
}

export class StorageInfoService {
  private cache?: StorageInfo;

  constructor(private dir: string) {}

  async get() {
    if (this.cache) return this.cache;

    try {
      const info: StorageInfo = JSON.parse(
        await Deno.readTextFile(join(this.dir, "info.json")),
      );

      this.cache = info;

      return info;
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;

      this.cache = {};
      return this.cache!;
    }
  }

  async update(data: StorageInfo) {
    await Deno.writeTextFile(join(this.dir, "info.json"), JSON.stringify(data));
  }
}

export class FileStorage implements CacheKvStore {
  private info: StorageInfoService;
  private responseCache = new Map<string, SerializedResponse>();

  constructor(private dir: string) {
    this.info = new StorageInfoService(dir);

    queueMicrotask(async () => {
      const infos = await this.info.get();

      for (const key in infos) {
        const info = infos[key];

        if (info.expireIn != null) {
          setTimeout(() => {
            this.remove(key);
          }, info.createdAt + info.expireIn - Date.now());
        }
      }
    });
  }

  async remove(key: string): Promise<void> {
    const infos = await this.info.get();
    if (infos[key] == null) return;

    delete infos[key];

    await Deno.remove(join(this.dir, key));

    this.info.update(infos);
  }

  async set(
    key: string,
    value: SerializedResponse,
    option?: { expireIn: number },
  ): Promise<void> {
    const info = await this.info.get();

    info[key] = {
      status: value.status,
      headers: value.headers,
      createdAt: Date.now(),
      expireIn: option?.expireIn,
    };
    if (option?.expireIn != null) {
      setTimeout(() => {
        this.remove(key);
      }, option.expireIn);
    }

    await Deno.writeFile(join(this.dir, key), new Uint8Array(value.body));

    this.info.update(info);
  }

  async get(key: string): Promise<{ value: SerializedResponse | undefined }> {
    const info = await this.info.get();

    if (!(key in info)) return { value: undefined };

    const cache = this.responseCache.get(key);
    if (cache) return { value: cache };

    const responseInfo = info[key];

    let body: Uint8Array;
    try {
      body = await Deno.readFile(join(this.dir, key));
    } catch (err) {
      console.error(err);

      return { value: undefined };
    }

    const response: SerializedResponse = {
      status: responseInfo.status,
      headers: responseInfo.headers,
      body: body.buffer,
    };

    this.responseCache.set(key, response);
    setTimeout(() => {
      this.responseCache.delete(key);
    }, 1000 * 60 * 30);

    return { value: response };
  }
}
