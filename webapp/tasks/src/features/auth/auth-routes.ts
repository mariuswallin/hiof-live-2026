import { route } from "rwsdk/router";
import { authController } from "./auth-controller";
import { requireUserPage } from "./middleware";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";

/**
 * Rutene auth-featuren eier. To lister, fordi de skal to forskjellige steder i
 * worker.tsx:
 *
 *   defineApp([
 *     setUser,
 *     ...authRoutes,                        svarer med en Response
 *     render(Document, [...authPages]),     svarer med en side (HTML)
 *   ])
 *
 * Logg inn med curl. `-c` lagrer cookien i en fil, `-b` sender den med:
 *
 *   curl -i -c admin.txt -d "user=kari&admin=on" localhost:5173/login
 *   curl -i -c bruker.txt -d "user=ola" localhost:5173/login
 */
export const authRoutes = [
  /**
   * Hvem tror serveren at jeg er?  200 OK
   *
   * Nyttig først i demoen: kjør den tre ganger og se ctx.user endre seg.
   *
   * curl -s localhost:5173/api/me
   * curl -s localhost:5173/api/me -b bruker.txt
   * curl -s localhost:5173/api/me -b admin.txt
   *
   * Og én gang med en cookie du har skrevet selv. Signaturen mangler, så
   * serveren stoler ikke på den:
   *
   * curl -s localhost:5173/api/me -H "Cookie: session=kari:admin"
   */
  route("/api/me", authController.me),

  route("/logout", { post: authController.logout }),
];

export const authPages = [
  // Samme adresse, to metoder: GET viser skjemaet, POST tar imot det.
  route("/login", { get: LoginPage, post: authController.login }),

  // Vakten står FØRST. Uten innlogging rendres ProfilePage aldri.
  route("/profile", [requireUserPage, ProfilePage]),
];
