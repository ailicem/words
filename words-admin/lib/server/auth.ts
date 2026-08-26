import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSessions, adminUsers, type AdminUser } from "@/lib/db/schema";

export const SESSION_COOKIE = "admin_session";
// 会话有效期 7 天
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function serializeCookie(
  name: string,
  value: string,
  maxAge: number
): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function readSessionToken(
  req: Pick<NextApiRequest, "cookies">
): string | undefined {
  return req.cookies?.[SESSION_COOKIE];
}

export async function getUserFromToken(
  token: string | undefined
): Promise<AdminUser | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  const user = rows[0]?.user;
  if (!user || user.status !== "active") return null;
  return user;
}

export async function createSession(
  res: NextApiResponse,
  userId: number
): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(adminSessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, token, maxAge));
}

export async function destroySession(
  res: NextApiResponse,
  token: string | undefined
): Promise<void> {
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// 判断是否存在任意管理员
export async function hasAnyAdmin(): Promise<boolean> {
  const rows = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  return rows.length > 0;
}

// 脱敏后的用户信息，用于返回给前端
export function sanitizeUser(user: AdminUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// 获取当前登录用户（带会话校验）
export async function getSessionUser(
  req: Pick<NextApiRequest, "cookies">
): Promise<AdminUser | null> {
  return getUserFromToken(readSessionToken(req));
}

// 要求必须是系统管理员（super_admin），否则返回错误码
export async function requireSuperAdmin(req: NextApiRequest): Promise<{
  user: AdminUser | null;
  status?: number;
}> {
  const user = await getSessionUser(req);
  if (!user) return { user: null, status: 401 };
  if (user.role !== "super_admin") return { user: null, status: 403 };
  return { user };
}