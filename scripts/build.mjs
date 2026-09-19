import { cp, mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { build } from "esbuild";
import { createHash } from "node:crypto";
// Les sources lisibles restent dans src/ ; dist/ ne contient que les livrables.
await rm("dist/client", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await cp("public", "dist/client", { recursive: true });
await cp("src/client", "dist/client", { recursive: true });
await build({
  entryPoints: ["src/server/worker.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "dist/server/index.js",
});
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
async function list(path, prefix = "") {
  let paths = [];
  for (const e of await readdir(path, { withFileTypes: true })) {
    const name = prefix + e.name;
    if (e.isDirectory())
      paths.push(...(await list(path + "/" + e.name, name + "/")));
    else paths.push(name);
  }
  return paths;
}
const paths = (await list("dist/client")).filter(
  (p) => !p.endsWith("original.js") && !p.endsWith("legacy.js"),
);
const hash = createHash("sha256");
for (const p of paths) hash.update(await readFile("dist/client/" + p));
const version = hash.digest("hex").slice(0, 12);
const sw = `const CACHE='trame-v2-${version}';const FILES=${JSON.stringify(["./", ...paths.map((p) => "./" + p)])};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));\nself.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('trame-static')||k.startsWith('trame-v2-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(url.pathname.includes('/api/')){if(url.pathname.includes('/api/media/'))event.respondWith(caches.open('trame-media-v2').then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}));return}event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(response=>response||fetch(event.request)))});`;
await writeFile("dist/client/sw.js", sw);
console.log("Application préparée · cache " + version);
