import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { sanitizeUser, requireSuperAdmin } from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user, status } = await requireSuperAdmin(req);
  if (!user) {
    return res
      .status(status ?? 401)
      .json({ message: status === 403 ? "无权限操作" : "未登录" });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "无效的 ID" });
  }

  if (req.method === "PATCH") {
    const { name, role, status: nextStatus, password } = req.body ?? {};
    const target = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    if (target.length === 0) {
      return res.status(404).json({ message: "管理员不存在" });
    }
    const current = target[0];

    if (role && role !== "super_admin" && role !== "admin") {
      return res.status(400).json({ message: "无效的角色" });
    }
    if (nextStatus && nextStatus !== "active" && nextStatus !== "disabled") {
      return res.status(400).json({ message: "无效的状态" });
    }

    // 不允许修改当前的系统管理员，避免锁死最后一席
    if (current.role === "super_admin" && role === "admin") {
      return res.status(400).json({ message: "不能将系统管理员降级" });
    }
    if (!role && nextStatus === "disabled" && current.role === "super_admin") {
      return res.status(400).json({ message: "不能停用系统管理员" });
    }

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (role) updates.role = role;
    if (nextStatus) updates.status = nextStatus;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "密码长度至少为 6 位" });
      }
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    const [updated] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();

    return res.status(200).json({ user: sanitizeUser(updated) });
  }

  return res.status(405).json({ message: "Method not allowed" });
}