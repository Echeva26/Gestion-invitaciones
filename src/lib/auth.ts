import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, MAGIC_TTL_MINUTES } from "@/lib/constants";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET no está configurado (mínimo 16 caracteres).");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  ownerId: string;
  role: "OWNER" | "ADMIN";
  name: string;
};

// ── Sesión (cookie JWT firmada) ──────────────────────────────────────────

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      ownerId: String(payload.ownerId),
      role: payload.role === "ADMIN" ? "ADMIN" : "OWNER",
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Lee y verifica la sesión actual (en Server Components / route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ── Tokens mágicos (de un solo uso) ──────────────────────────────────────

export function generateMagicToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
