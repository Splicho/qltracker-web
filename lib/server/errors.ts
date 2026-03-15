import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class RouteError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RouteError";
    this.status = status;
  }
}

export function routeError(status: number, message: string): never {
  throw new RouteError(status, message);
}

export function handleRouteError(error: unknown) {
  if (error instanceof RouteError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Notification service is not configured correctly." },
      { status: 500 },
    );
  }

  console.error(error);

  return NextResponse.json(
    { message: "Notification service request failed." },
    { status: 500 },
  );
}
