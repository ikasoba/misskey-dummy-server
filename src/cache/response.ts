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
