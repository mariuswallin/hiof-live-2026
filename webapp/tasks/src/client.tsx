import { initClient } from "rwsdk/client";

initClient({
  // En server action sendes med fetch, til adressen du står på. Svarer en vakt
  // med redirect (requireUserPage, fordi cookien gikk ut mens siden sto åpen),
  // laster vi siden på nytt. Da følger nettleseren redirecten til /login.
  handleResponse: (response) => {
    if (response.type === "opaqueredirect") {
      window.location.reload();
      return false;
    }

    return true;
  },
});
