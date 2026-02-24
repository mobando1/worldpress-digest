import { NextResponse } from "next/server";

/**
 * Application error with an HTTP status code and machine-readable code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code ?? statusCodeToCode(statusCode);

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Build a JSON error response from any thrown value.
 * - AppError instances use their own statusCode and code.
 * - ZodError instances return 400 with validation details.
 * - Everything else returns a generic 500.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors (they have a `.issues` array)
  if (
    error instanceof Error &&
    "issues" in error &&
    Array.isArray((error as Record<string, unknown>).issues)
  ) {
    const issues = (error as Record<string, unknown>).issues as Array<{
      path: (string | number)[];
      message: string;
    }>;

    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV !== "production") {
    console.error("[Unhandled Error]", error);
  }

  const message =
    error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json(
    { error: message, code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusCodeToCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_ERROR";
  }
}
