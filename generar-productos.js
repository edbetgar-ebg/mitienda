/**
 * Escanea img/<categoria>/<proveedor>/<archivo>.jpg
 * El proveedor sale del NOMBRE DE LA CARPETA.
 * El archivo solo lleva: nombre-precio.jpg
 */

const fs = require("fs");
const path = require("path");

const CARPETA_IMG = path.join(__dirname, "img");
const CATEGORIAS = [
  "electrodomesticos",
  "transporte",
  "celulares",
  "accesorios",
  "pcylaptops",
];

const EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const productos = [];

console.log("🔍 Escaneando carpetas...\n");

for (const cat of CATEGORIAS) {
  const rutaCat = path.join(CARPETA_IMG, cat);
  if (!fs.existsSync(rutaCat)) {
    console.warn("⚠️  No existe: " + cat);
    continue;
  }

  const proveedores = fs
    .readdirSync(rutaCat, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (proveedores.length === 0) {
    console.warn("⚠️  " + cat + ": sin carpetas de proveedor");
    continue;
  }

  let totalCat = 0;

  for (const proveedor of proveedores) {
    const rutaProv = path.join(rutaCat, proveedor);
    const archivos = fs.readdirSync(rutaProv);
    let contador = 0;

    for (const archivo of archivos) {
      const ext = path.extname(archivo).toLowerCase();
      if (!EXT.includes(ext)) continue;

      const base = path.basename(archivo, ext);
      const partes = base.split("-");

      if (partes.length < 2) {
        console.warn("⏭️  Formato inválido: " + proveedor + "/" + archivo);
        continue;
      }

      const precio = parseInt(partes[partes.length - 1], 10);
      const nombrePartes = partes.slice(0, -1);

      if (isNaN(precio)) {
        console.warn("⏭️  Precio inválido: " + proveedor + "/" + archivo);
        continue;
      }

      const nombre = nombrePartes
        .join(" ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const rutaTxt = path.join(rutaProv, base + ".txt");
      let descripcion = "";
      if (fs.existsSync(rutaTxt)) {
        descripcion = fs.readFileSync(rutaTxt, "utf-8").trim();
      }

      productos.push({
        id: cat + "-" + proveedor + "-" + contador,
        nombre: nombre,
        precio: precio,
        proveedor: proveedor,
        categoria: cat,
        descripcion: descripcion,
        archivo: proveedor + "/" + archivo,
        imagen: "img/" + cat + "/" + proveedor + "/" + archivo,
      });
      contador++;
      totalCat++;
    }
    console.log("   ✅ " + cat + "/" + proveedor + ": " + contador);
  }
  console.log("📦 " + cat + ": " + totalCat + " producto(s)\n");
}

fs.writeFileSync(
  path.join(__dirname, "productos.json"),
  JSON.stringify(productos, null, 2),
  "utf-8"
);

console.log("🎉 Total: " + productos.length + " productos generados");