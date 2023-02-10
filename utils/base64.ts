export function encodeToBase64(data: string) {
  return Buffer.from(data).toString("base64");
}

export function decodeFromBase64(data: string) {
  const buff = Buffer.from(data, "base64");
  return JSON.parse(buff.toString("ascii"));
}
