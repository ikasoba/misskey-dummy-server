export interface RequesterRequest {
  method: string;
  url: string;

  headers: Record<string, string>;
  /** base64 binary */
  body?: string;
}

type FetchApi = typeof fetch;
export const createRequester = (fetch: FetchApi) => {
  return async (req: RequesterRequest): Promise<void> => {
    const res = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    if (!res.ok) {
      console.error(
        "[requester]",
        "failed to request.",
        `method = ${req.method}, url = ${req.url}`,
        `status = ${res.status} ${res.statusText}`,
      );
    }
  };
};
