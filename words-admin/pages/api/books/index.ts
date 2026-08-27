import type { NextApiRequest, NextApiResponse } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { books, type Book } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/server/auth";

export function sanitizeBook(book: Book) {
  return {
    id: book.id,
    title: book.title,
    wordCount: book.wordCount,
    coverUrl: book.coverUrl,
    bookId: book.bookId,
    tags: book.tags,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ message: "未登录" });
  }

  if (req.method === "GET") {
    const rows = await db.select().from(books).orderBy(asc(books.id));
    return res.status(200).json({ books: rows.map(sanitizeBook) });
  }

  if (req.method === "POST") {
    const { title, wordCount, coverUrl, bookId, tags } = req.body ?? {};
    if (!title?.trim() || !bookId?.trim()) {
      return res.status(400).json({ message: "请填写单词书标题和 bookId" });
    }

    const existing = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.bookId, bookId.trim()))
      .limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ message: "该 bookId 已存在" });
    }

    const [inserted] = await db
      .insert(books)
      .values({
        title: title.trim(),
        wordCount: Number.isInteger(wordCount) && Number(wordCount) >= 0 ? Number(wordCount) : 0,
        coverUrl: coverUrl?.trim() || null,
        bookId: bookId.trim(),
        tags: tags?.trim() || null,
      })
      .returning();

    return res.status(201).json({ book: sanitizeBook(inserted) });
  }

  return res.status(405).json({ message: "Method not allowed" });
}