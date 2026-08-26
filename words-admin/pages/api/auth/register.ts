import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import {
  createSession,
  hasAnyAdmin,
  sanitizeUser,
} from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "请填写所有字段" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "密码长度至少为 6 位" });
  }

  // 仅允许注册首个系统管理员
  if (await hasAnyAdmin()) {
    return res.status(403).json({ message: "系统管理员已存在，无法再次注册" });
  }

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email.trim().toLowerCase()))
    .limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ message: "该邮箱已被注册" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [inserted] = await db
    .insert(adminUsers)
    .values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "super_admin",
    })
    .returning();

  await createSession(res, inserted.id);

  return res.status(201).json({ user: sanitizeUser(inserted) });
}