const DB = "trame-mjc-v1";
let db;
export async function openDB() {
  if (db) return db;
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("data");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return db;
}
export async function read(key) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const r = d.transaction("data").objectStore("data").get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function write(key, value) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction("data", "readwrite");
    tx.objectStore("data").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export function download(name, body, type = "application/json") {
  const a = document.createElement("a"),
    u = URL.createObjectURL(new Blob([body], { type }));
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 10000);
}
export function fileData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
/** Le journal est partagé par les onglets et survit à leur fermeture. */
export async function entries(prefix) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const result = [],
      r = d.transaction("data").objectStore("data").openCursor();
    r.onsuccess = () => {
      const c = r.result;
      if (!c) return resolve(result);
      if (String(c.key).startsWith(prefix)) result.push([c.key, c.value]);
      c.continue();
    };
    r.onerror = () => reject(r.error);
  });
}
export async function remove(key) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction("data", "readwrite");
    tx.objectStore("data").delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
