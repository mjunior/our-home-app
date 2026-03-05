import { createHmac, timingSafeEqual } from "node:crypto";

const header = { alg: "HS256", typ: "JWT" };

export interface SessionClaims {
  sub: string;
  householdId: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(raw: string | Buffer) {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(data: string, secret: string) {
  return base64UrlEncode(createHmac("sha256", secret).update(data).digest());
}

export function issueSessionToken(input: {
  userId: string;
  householdId: string;
  secret: string;
  now?: number;
  ttlSeconds?: number;
}): string {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const ttlSeconds = input.ttlSeconds ?? 60 * 60 * 24 * 7;

  const payload: SessionClaims = {
    sub: input.userId,
    householdId: input.householdId,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const body = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(body, input.secret);

  return `${body}.${signature}`;
}

export function verifySessionToken(token: string, secret: string, now?: number): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const body = `${encodedHeader}.${encodedPayload}`;
  const expected = sign(body, secret);

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(encodedSignature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsedHeader = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; typ?: string };
    if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT") {
      return null;
    }

    const claims = JSON.parse(base64UrlDecode(encodedPayload)) as SessionClaims;
    const clock = now ?? Math.floor(Date.now() / 1000);

    if (!claims.sub || !claims.householdId || typeof claims.exp !== "number" || typeof claims.iat !== "number") {
      return null;
    }

    if (claims.exp <= clock) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
