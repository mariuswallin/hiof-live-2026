import type { LayoutProps } from "rwsdk/router";
import { requestInfo } from "rwsdk/worker";
import { AuthProvider } from "@/features/auth/components/AuthProvider";

/**
 * Layouten rundt alle sidene. Kobles på i worker.tsx:
 *
 *   render(Document, [layout(AppLayout, [route("/", Home), ...])])
 *
 * En server-komponent, så den leser `ctx.user` direkte. Den gjør to ting med
 * brukeren:
 *
 *   1. Tegner menyen selv. Ingen context trengs: vi ER på serveren.
 *   2. Sender brukeren til <AuthProvider>, så klient-komponentene lenger ned
 *      (TaskItem) kan hente den med useAuth().
 *
 * Layouten rendres på nytt for hver forespørsel. Derfor er menyen og context
 * alltid i takt med cookien.
 *
 * "Logg ut" er et skjema, ikke en lenke: utlogging endrer noe, og skal være en
 * POST. Se auth-routes.ts.
 */
export function AppLayout({ children }: LayoutProps) {
  const { ctx } = requestInfo;
  const { user } = ctx;

  return (
    <AuthProvider user={user}>
      <header className="border-b border-slate-200 font-sans text-sm">
        <nav className="mx-auto flex max-w-2xl items-center gap-4 px-8 py-3">
          <a className="underline" href="/">
            Forside
          </a>
          {/* Vises for alle, med vilje. Klikk uten å være innlogget, og
              requireUserPage sender deg til /login. */}
          <a className="underline" href="/tasks">
            Oppgaver
          </a>

          <span className="ml-auto" data-testid="logged-in-as">
            {user ? `${user.name} (${user.role})` : "Ikke innlogget"}
          </span>

          {user ? (
            <form method="post" action="/logout">
              <button
                type="submit"
                className="rounded border border-slate-300 px-2 py-1"
              >
                Logg ut
              </button>
            </form>
          ) : (
            <a className="rounded border border-slate-300 px-2 py-1" href="/login">
              Logg inn
            </a>
          )}
        </nav>
      </header>

      {children}
    </AuthProvider>
  );
}
