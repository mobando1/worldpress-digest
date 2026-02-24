import { NextRequest } from "next/server";
import { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";

/**
 * Extract the Bearer token from the Authorization header,
 * verify it, load the full User record, and return it.
 *
 * Throws AppError(401) when the token is missing / invalid / user not found.
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Missing or malformed Authorization header", 401);
  }

  const token = authHeader.slice(7); // strip "Bearer "

  let payload: { userId: string; role: string };
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError("User not found", 401);
  }

  return user;
}

/**
 * Same as requireAuth but additionally checks that the user has the ADMIN role.
 *
 * Throws AppError(403) when the user is not an admin.
 */
export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request);

  if (user.role !== "ADMIN") {
    throw new AppError("Admin access required", 403);
  }

  return user;
}
