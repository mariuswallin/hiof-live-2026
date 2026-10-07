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
  fieldErrors?: Record<string, string[] | undefined>;
};

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
