import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers, type AdminUser } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/server/auth";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user: _current, status } = await requireSuperAdmin(req);
  if (!_current) {
    return res
      .status(status ?? 401)
      .json({ message: status === 403 ? "无权限操作" : "未登录" });
  }

  if (req.method === "GET") {
    const rows = await db.select().from(adminUsers).orderBy(adminUsers.createdAt);
    return res.status(200).json({ users: rows.map(sanitizeUser) });
  }

  if (req.method === "POST") {
    const { name, email, password, role } = req.body ?? {};
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "请填写姓名、邮箱和密码" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "密码长度至少为 6 位" });
    }
    if (role !== "super_admin" && role !== "admin") {
      return res.status(400).json({ message: "无效的角色" });
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
        role,
      })
      .returning();

    return res.status(201).json({ user: sanitizeUser(inserted) });
  }

  return res.status(405).json({ message: "Method not allowed" });
}