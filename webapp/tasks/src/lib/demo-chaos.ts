import { Errors, type ResultError } from "./result";

const FAILURE_RATE = 1 / 3;

const isEnabled = (request: Request) =>
  Boolean(import.meta.env.VITE_IS_DEV_SERVER) &&
  request.headers.get("x-demo-chaos") !== "off";

export async function demoDelay(request: Request, ms: number) {
  if (!isEnabled(request)) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function demoFailure(request: Request): ResultError | null {
  if (!isEnabled(request) || Math.random() >= FAILURE_RATE) return null;

  return {
    code: Errors.INTERNAL_SERVER_ERROR,
    message: "Tilfeldig feil (demo). Prøv igjen.",
  };
}
