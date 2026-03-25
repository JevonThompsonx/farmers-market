import { type NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";

type RouteHandler<P extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  context: { params: Promise<P> },
) => Promise<NextResponse>;

export function apiHandler<P extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<P>,
): RouteHandler<P> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.name,
            message: error.message,
            statusCode: error.statusCode,
          },
          { status: error.statusCode },
        );
      }
      logger.error(error, "Unhandled route error");
      return NextResponse.json(
        { error: "InternalServerError", message: "Something went wrong", statusCode: 500 },
        { status: 500 },
      );
    }
  };
}
