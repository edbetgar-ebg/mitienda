const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const RAIZ = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split("?")[0]);
  if (ruta === "/") ruta = "/index.html";
  const archivo = path.join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  fs.readFile(archivo, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("No encontrado"); return; }
    const ext = path.extname(archivo).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log("====================================");
  console.log("   SERVIDOR TIENDA ACTIVO");
  console.log("====================================");
  console.log("");
  console.log("   Abre: http://localhost:" + PORT);
  console.log("");
});