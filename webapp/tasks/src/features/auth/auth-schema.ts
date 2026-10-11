import { z } from "zod";
import { DEMO_USER_KEYS } from "./demo-users";

/**
 * Det innloggingsskjemaet får lov til å sende.
 *
 * Skjemaet på /login har bare radioknapper og en avkryssingsboks, så en
 * nettleser klarer ikke å sende noe ugyldig. Men skjemaet er ikke den eneste
 * som kan poste hit. curl kan sende `user=root`. Derfor valideres det likevel.
 *
 * `z.enum` er en allowlist: bare brukerne vi kjenner slipper gjennom.
 *
 * En avkryssingsboks sender "on" når den er krysset av, og INGENTING når den
 * ikke er det. Derfor `optional`, og derfor finnes det ingen "off".
 */
export const loginSchema = z.object({
  user: z.enum(DEMO_USER_KEYS, "Velg en av brukerne i lista"),
  admin: z.literal("on").optional(),
});
