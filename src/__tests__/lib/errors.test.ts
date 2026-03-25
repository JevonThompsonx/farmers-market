import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from "@/lib/errors";

describe("AppError", () => {
  it("sets statusCode and message", () => {
    const err = new AppError(500, "server error");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("server error");
    expect(err.name).toBe("AppError");
  });

  it("is an instance of Error", () => {
    expect(new AppError(500, "x")).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("has statusCode 404 and default message", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("NotFoundError");
  });

  it("accepts custom message", () => {
    const err = new NotFoundError("Farm 123 not found");
    expect(err.message).toBe("Farm 123 not found");
  });

  it("is an instance of AppError", () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });
});

describe("UnauthorizedError", () => {
  it("has statusCode 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("UnauthorizedError");
  });

  it("accepts custom message", () => {
    expect(new UnauthorizedError("sign in").message).toBe("sign in");
  });
});

describe("ForbiddenError", () => {
  it("has statusCode 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.name).toBe("ForbiddenError");
  });

  it("accepts custom message", () => {
    expect(new ForbiddenError("not your resource").message).toBe(
      "not your resource",
    );
  });
});

describe("ValidationError", () => {
  it("has statusCode 400", () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("ValidationError");
  });

  it("accepts custom message", () => {
    expect(new ValidationError("bad input").message).toBe("bad input");
  });
});
