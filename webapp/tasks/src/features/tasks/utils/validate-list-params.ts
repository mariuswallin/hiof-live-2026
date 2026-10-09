import type { Params } from "./parse-params";

export type TaksListParams = {
  completed?: boolean;
  q?: string;
  limit?: number;
};

export type ListParamsValidation =
  | {
      ok: true;
      params: TaksListParams;
    }
  | { ok: false; field: keyof TaksListParams; error: string };

export const LIST_LIMIT_MAX = 100;

export function validateListParams(input: Params): ListParamsValidation {
  const params: TaksListParams = {};

  if (input.completed) {
    const invalidCompletedValue =
      input.completed !== "true" && input.completed !== "false";

    if (invalidCompletedValue) {
      return {
        ok: false,
        field: "completed",
        error: "completed må være true eller false",
      };
    }
    params.completed = input.completed === "true";
  }

  const search = input.q?.trim();

  if (search) params.q = search;

  if (input.limit) {
    const limit = Number(input.limit);

    const isValidLimit =
      Number.isInteger(limit) && limit >= 1 && limit <= LIST_LIMIT_MAX;

    if (!isValidLimit) {
      return {
        ok: false,
        field: "limit",
        error: `limit må være et heltall fra 1 til ${LIST_LIMIT_MAX}`,
      };
    }
    params.limit = limit;
  }
  return { ok: true, params };
}
