import type { NextApiRequest, NextApiResponse } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/server/auth";
import { sanitizeBook } from "./index";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ message: "未登录" });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "无效的 ID" });
  }

  if (req.method === "PATCH") {
    const { title, wordCount, coverUrl, bookId, tags } = req.body ?? {};
    const target = await db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);
    if (target.length === 0) {
      return res.status(404).json({ message: "单词书不存在" });
    }

    const updates: Record<string, unknown> = {};
    if (title?.trim()) updates.title = title.trim();
    if (Number.isInteger(wordCount) && Number(wordCount) >= 0) {
      updates.wordCount = Number(wordCount);
    }
    if (typeof coverUrl === "string") updates.coverUrl = coverUrl.trim() || null;
    if (typeof tags === "string") updates.tags = tags.trim() || null;
    if (typeof bookId === "string") {
      const nextBookId = bookId.trim();
      if (!nextBookId) {
        return res.status(400).json({ message: "bookId 不能为空" });
      }
      const dup = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.bookId, nextBookId))
        .limit(1);
      if (dup.length > 0 && dup[0].id !== id) {
        return res.status(409).json({ message: "该 bookId 已存在" });
      }
      updates.bookId = nextBookId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "没有需要修改的内容" });
    }

    const [updated] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();

    return res.status(200).json({ book: sanitizeBook(updated) });
  }

  if (req.method === "DELETE") {
    const target = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.id, id))
      .limit(1);
    if (target.length === 0) {
      return res.status(404).json({ message: "单词书不存在" });
    }

    // 删除图书；words 表通过 bookId 外键 onDelete cascade，同图书的单词一并删除
    await db.delete(books).where(eq(books.id, id));

    return res.status(200).json({ message: "删除成功" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}