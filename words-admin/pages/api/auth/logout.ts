import type { NextApiRequest, NextApiResponse } from "next";
import { destroySession, readSessionToken } from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await destroySession(res, readSessionToken(req));
  return res.status(200).json({ ok: true });
}