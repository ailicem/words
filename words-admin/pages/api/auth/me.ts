import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionUser, sanitizeUser } from "@/lib/server/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const user = await getSessionUser(req);
  return res.status(200).json({ user: user ? sanitizeUser(user) : null });
}