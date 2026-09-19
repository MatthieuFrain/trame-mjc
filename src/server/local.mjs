import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./worker.js";
const base = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
try {
  process.loadEnvFile(path.join(base, ".env"));
} catch {}
const directory = process.env.TRAME_DATA_DIR || path.join(base, ".data");
await mkdir(directory, { recursive: true });
await mkdir(path.join(directory, "media"), { recursive: true });
const database = new DatabaseSync(path.join(directory, "atelier.sqlite"));
database.exec("PRAGMA journal_mode=WAL");
database.exec(
  "CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)",
);
for (const file of (await readdir(path.join(base, "drizzle")))
  .filter((x) => x.endsWith(".sql"))
  .sort()) {
  if (
    !database
      .prepare("SELECT name FROM local_migrations WHERE name = ?")
      .get(file)
  ) {
    database.exec(await readFile(path.join(base, "drizzle", file), "utf8"));
    database
      .prepare("INSERT INTO local_migrations (name) VALUES (?)")
      .run(file);
  }
}
// Adaptateurs locaux : les mêmes routes s’exécutent en local et dans le service partagé.
function statement(sql, values = []) {
  return {
    bind(...next) {
      return statement(sql, next);
    },
    async first() {
      return database.prepare(sql).get(...values) || null;
    },
    async all() {
      return { results: database.prepare(sql).all(...values) };
    },
    run() {
      const r = database.prepare(sql).run(...values);
      return { meta: { changes: Number(r.changes) } };
    },
  };
}
const DB = {
  prepare: (sql) => statement(sql),
  async batch(statements) {
    database.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const q of statements) results.push(q.run());
      database.exec("COMMIT");
      return results;
    } catch (e) {
      database.exec("ROLLBACK");
      throw e;
    }
  },
};
const MEDIA = {
  async put(id, bytes, options) {
    await writeFile(path.join(directory, "media", id), Buffer.from(bytes));
    await writeFile(
      path.join(directory, "media", id + ".json"),
      JSON.stringify(options.httpMetadata),
    );
  },
  async get(id) {
    try {
      const bytes = await readFile(path.join(directory, "media", id)),
        meta = JSON.parse(
          await readFile(path.join(directory, "media", id + ".json"), "utf8"),
        );
      return {
        body: bytes,
        writeHttpMetadata(headers) {
          headers.set("Content-Type", meta.contentType);
        },
      };
    } catch {
      return null;
    }
  },
};
const mime = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".pdf": "application/pdf",
};
const ASSETS = {
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname),
      root = path.join(base, "dist/client"),
      file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
    if (!file.startsWith(root + path.sep))
      return new Response("Interdit", { status: 403 });
    try {
      if (!(await stat(file)).isFile()) throw Error();
      return new Response(await readFile(file), {
        headers: {
          "Content-Type":
            mime[path.extname(file)] || "application/octet-stream",
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      return new Response("Introuvable", { status: 404 });
    }
  },
};
const host = process.env.HOST || "127.0.0.1",
  port = Number(process.env.PORT || 4173);
if (host !== "127.0.0.1" && host !== "localhost")
  throw Error(
    "Le serveur local reste sur cet ordinateur. Utilisez l’espace privé HTTPS pour les autres appareils.",
  );
http
  .createServer(async (req, res) => {
    try {
      const origin = `http://${req.headers.host}`,
        url = new URL(req.url, origin),
        headers = new Headers(req.headers);
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : req;
      const request = new Request(url, {
        method: req.method,
        headers,
        body,
        duplex: "half",
      });
      const response = await worker.fetch(
        request,
        {
          DB,
          MEDIA,
          ASSETS,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          REALTIME_MODEL: process.env.REALTIME_MODEL,
          MAX_SESSIONS_PER_HOUR: process.env.MAX_SESSIONS_PER_HOUR,
        },
        {},
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end("Service local indisponible");
    }
  })
  .listen(port, host, () => console.log(`Trame : http://${host}:${port}`));
