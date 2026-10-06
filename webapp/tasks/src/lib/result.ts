/**
 * Result-mønsteret, forenklet fra webapp-2025 (leksjon 13 og 13a).
 *
 * I stedet for å kaste feil oppover, returnerer hvert lag ENTEN data ELLER en
 * feil. Typen tvinger kalleren til å sjekke `success` før `data` kan brukes:
 *
 *   const result = await taskService.get(id);
 *   if (!result.success) return createErrorResponse(result.error);
 *   result.data   // her vet TypeScript at data finnes
 *
 * TANKE: Hvorfor er dette bedre enn try/catch overalt? Hva skjer med en feil
 * som ingen fanger i en worker? (Svar: 500, og en stacktrace i loggen, men
 * ingen kontroll over hva brukeren ser.)
 */
export const Errors = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = keyof typeof Errors;

export type ResultError = {
  code: ErrorCode;
  message: string;
  // Feil per felt fra Zod. Skjemaet bruker dem til å vise feil under feltet.
  fieldErrors?: Record<string, string[] | undefined>;
};

/**
 * En "discriminated union": `success` er diskriminanten. Sjekk den, så
 * snevrer TypeScript inn typen for deg.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ResultError };

export const ResultHandler = {
  success: <T>(data: T): Result<T> => ({ success: true, data }),

  failure: <T = never>(
    message: string,
    code: ErrorCode = Errors.INTERNAL_SERVER_ERROR,
    fieldErrors?: ResultError["fieldErrors"],
  ): Result<T> => ({ success: false, error: { code, message, fieldErrors } }),
};

/**
 * Pakker inn ett databasekall. Kaster databasen (fremmednøkkel, låst fil,
 * nettverk mot D1), blir det en INTERNAL_SERVER_ERROR i stedet for et krasj.
 *
 * Repositoryet kaster altså aldri ut av seg selv. Det gjør laget over enkelt.
 */
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
): Promise<Result<T>> {
  try {
    return ResultHandler.success(await operation());
  } catch (error) {
    console.error("Databasekall feilet:", error);
    return ResultHandler.failure("Noe gikk galt i databasen");
  }
}
