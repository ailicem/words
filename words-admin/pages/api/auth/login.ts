import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { createSession, sanitizeUser } from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "请输入邮箱和密码" });
  }

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }
  if (user.status !== "active") {
    return res.status(403).json({ message: "该账号已被停用" });
  }

  await createSession(res, user.id);

  return res.status(200).json({ user: sanitizeUser(user) });
}