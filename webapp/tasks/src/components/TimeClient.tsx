"use client";

import { useEffect, useState } from "react";

/**
 * Samme klokke som i Home, men tidspunktet leses i NETTLESEREN.
 *
 * En klient-komponent rendres to ganger: først på serveren, til HTML, og så i
 * nettleseren, når React tar over (hydrering). Leser vi klokka rett i render,
 * får de to gangene ulik tekst. Workeren går på UTC og nettleseren på norsk
 * tid, og React klager i konsollen: "Hydration failed because the server
 * rendered text didn't match the client".
 *
 * useEffect kjører bare i nettleseren, og først etter hydrering. Da er HTML-en
 * fra serveren lik den første rendringen i nettleseren ("…"), og klokka fylles
 * inn etterpå.
 */
export function TimeClient() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => setNow(new Date().toLocaleString("no-NO")), []);

  return (
    <p className="mt-6 text-sm text-slate-500">
      Rendret på klienten {now ?? "…"}. Last siden på nytt, så endrer tallet seg.
    </p>
  );
}
