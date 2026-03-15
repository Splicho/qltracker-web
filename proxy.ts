import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      headers: API_CORS_HEADERS,
      status: 204,
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(API_CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
