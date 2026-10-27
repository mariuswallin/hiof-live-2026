import type { RouteMiddleware } from "rwsdk/router";

const allowedOrigins = new Set(["http://localhost:8081"]);

export const cors =
  (): RouteMiddleware =>
  ({ request, response }) => {
    const origin = request.headers.get("Origin");

    if (!origin || !allowedOrigins.has(origin)) return;

    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  };
