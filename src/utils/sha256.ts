export const sha256 = async (data: BufferSource): Promise<string> =>
  bin2hex(await crypto.subtle.digest("sha-256", data));

export const bin2hex = (data: ArrayBuffer) =>
  [...new Uint8Array(data)].map((x) => x.toString(16).padStart(2, "0")).join(
    "",
  );
