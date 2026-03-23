import { type NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
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
