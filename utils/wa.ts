import { redis, keyFor } from "./redis";
import { decrypt, encrypt } from "./crypto";
import type { IntegrationCreds } from "./types";

export async function saveCreds(integrationId: string, creds: IntegrationCreds) {
  await redis.set(keyFor(integrationId), encrypt(creds));
}
export async function getCreds(integrationId: string): Promise<IntegrationCreds> {
  const enc = await redis.get<string>(keyFor(integrationId));
  if (!enc) throw new Error("Credentials not found");
  return decrypt<IntegrationCreds>(enc);
}

export async function waFetch<T>(
  integrationId: string,
  path: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const { version, token } = await getCreds(integrationId);
  const url = `https://graph.facebook.com/${version}${path}`;
  const headers = { 
    Authorization: `Bearer ${token}`, 
    "Content-Type": "application/json",
    ...extraHeaders
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}
