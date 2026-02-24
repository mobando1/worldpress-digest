import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { errorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE() {
  // The client is responsible for removing the token.
  // This endpoint exists as a conventional logout signal.
  return NextResponse.json({ message: "Logged out successfully" });
}
