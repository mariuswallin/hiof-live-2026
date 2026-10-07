import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/Home";

export type AppContext = {};

const app = defineApp([
  setCommonHeaders(),

  route("/api/status", () => Response.json({ status: "ok", version: "0.1.0" })),

  render(Document, [route("/", Home)]),
]);

export default { fetch: app.fetch };
