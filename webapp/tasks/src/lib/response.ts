import type { ErrorCode, ResultError } from "./result";

/**
 * Fra Result til HTTP. Brukes av controllere og mellomvare, så alle
 * API-svar har samme form:
 *
 *   { "success": true,  "data": ... }
 *   { "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
 *
 * Klienten kan da alltid sjekke `success` først, uansett rute.
 */
const statusByCode: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const codeToStatus = (code: ErrorCode) => statusByCode[code];

export function createSuccessResponse<T>(
  data: T,
  init: { status?: number; headers?: HeadersInit } = {},
) {
  return Response.json(
    { success: true, data },
    { status: init.status ?? 200, headers: init.headers },
  );
}

export function createErrorResponse(error: ResultError) {
  return Response.json(
    { success: false, error },
    {
      status: codeToStatus(error.code),
      // Feil skal aldri caches. Neste forsøk kan gå bra.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
