"use client";

import { useEffect, useState, useTransition } from "react";
import { navigate } from "rwsdk/client";
import type { SessionUser } from "../auth-types";
import { DEMO_USER_COOKIE, readCookie } from "../demo-user";

/**
 * Bytt bruker uten å åpne DevTools. Ligger fast nede i høyre hjørne.
 *
 * Viser to ting med vilje, side om side:
 *
 *   Cookie   det NETTLESEREN sender (document.cookie)
 *   Server   det SERVEREN konkluderte med (ctx.user, sendt hit som prop)
 *
 * Endrer du cookien til "tull", ser du at serveren likevel gjør deg til
 * vanlig bruker (se resolveDemoUser). Sletter du den, er du utlogget.
 *
 * Etter en endring henter vi siden på nytt med navigate(). Det rendrer
 * server-komponentene igjen MED den nye cookien, uten full omlasting.
 *
 * TANKE: At dette panelet i det hele tatt kan fungere, er beviset på at
 * demo-innloggingen er usikker. Klienten bestemmer selv hvem den er. Med en
 * signert cookie (HttpOnly, satt av serveren) kunne ikke JavaScript lest eller
 * endret den. Hva ville skjedd med panelet da?
 */
export function DemoUserPanel({ user }: { user: SessionUser | null }) {
  const [cookieValue, setCookieValue] = useState("");
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  // document.cookie finnes bare i nettleseren. Leses etter hydrering, ellers
  // blir server-HTML og klient-HTML ulike.
  useEffect(() => {
    const current = readCookie(document.cookie, DEMO_USER_COOKIE) ?? "";
    setCookieValue(current);
    setDraft(current);
  }, []);

  const applyCookie = (value: string) => {
    // max-age=0 sletter cookien. SameSite=Lax: sendes ikke med fra andre
    // nettsider sine skjemaer og fetch-kall.
    document.cookie = value
      ? `${DEMO_USER_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=3600; SameSite=Lax`
      : `${DEMO_USER_COOKIE}=; path=/; max-age=0`;

    setCookieValue(value);
    setDraft(value);

    startTransition(async () => {
      await navigate(window.location.pathname, {
        history: "replace",
        info: { scrollToTop: false },
      });
    });
  };

  const presets = [
    { label: "Ingen", value: "" },
    { label: "Bruker", value: "bruker" },
    { label: "Admin", value: "admin" },
  ];

  return (
    <details
      open
      className="fixed right-4 bottom-4 z-50 w-72 rounded-lg border border-slate-300 bg-white p-3 text-sm shadow-lg"
      aria-busy={isPending}
    >
      <summary className="cursor-pointer font-semibold">
        Demo-bruker {isPending && <span className="font-normal">· oppdaterer…</span>}
      </summary>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-slate-500">Server</dt>
        <dd data-testid="logged-in-as">
          {user ? `Innlogget som ${user.email}` : "Ikke innlogget"}
        </dd>
        <dt className="text-slate-500">Rolle</dt>
        <dd data-testid="role">{user?.role ?? "–"}</dd>
        <dt className="text-slate-500">Cookie</dt>
        <dd className="font-mono break-all" data-testid="cookie-value">
          {cookieValue ? `${DEMO_USER_COOKIE}=${cookieValue}` : "(ingen)"}
        </dd>
      </dl>

      <div className="mt-3 flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={isPending}
            onClick={() => applyCookie(preset.value)}
            aria-pressed={cookieValue === preset.value}
            className="flex-1 rounded border border-slate-300 px-2 py-1 aria-pressed:bg-slate-900 aria-pressed:text-white disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Fritt felt: skriv hva du vil i cookien og se hva serveren gjør. */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyCookie(draft.trim());
        }}
      >
        <label htmlFor="demo-cookie" className="sr-only">
          Verdi for {DEMO_USER_COOKIE}
        </label>
        <input
          id="demo-cookie"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="f.eks. admin"
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 font-mono"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-50"
        >
          Sett
        </button>
      </form>
    </details>
  );
}
