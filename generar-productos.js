const fs = require("fs");
const path = require("path");

const CARPETA_IMG = path.join(__dirname, "img");
const CATEGORIAS = ["electrodomesticos","transporte","celulares","accesorios","pcylaptops"];
const EXT = [".jpg",".jpeg",".png",".webp",".gif"];
const productos = [];

console.log("🔍 Escaneando carpetas...\n");

for (const cat of CATEGORIAS) {
  const rutaCat = path.join(CARPETA_IMG, cat);
  if (!fs.existsSync(rutaCat)) { continue; }
  const proveedores = fs.readdirSync(rutaCat, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  
  for (const proveedor of proveedores) {
    const rutaProv = path.join(rutaCat, proveedor);
    const archivos = fs.readdirSync(rutaProv);
    let contador = 0;
    for (const archivo of archivos) {
      const ext = path.extname(archivo).toLowerCase();
      if (!EXT.includes(ext)) continue;
      const base = path.basename(archivo, ext);
      const partes = base.split("-");
      if (partes.length < 2) continue;
      const precio = parseInt(partes[partes.length - 1], 10);
      const nombrePartes = partes.slice(0, -1);
      if (isNaN(precio)) continue;
      const nombre = nombrePartes.join(" ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const rutaTxt = path.join(rutaProv, base + ".txt");
      let descripcion = "";
      if (fs.existsSync(rutaTxt)) descripcion = fs.readFileSync(rutaTxt, "utf-8").trim();
      
      productos.push({
        id: cat + "-" + proveedor + "-" + contador,
        nombre,
        precio,
        proveedor,
        categoria: cat,
        descripcion,
        archivo: proveedor + "/" + archivo,
        imagen: "img/" + cat + "/" + proveedor + "/" + archivo
      });
      contador++;
    }
  }
}
fs.writeFileSync(path.join(__dirname, "productos.json"), JSON.stringify(productos, null, 2), "utf-8");
console.log("🎉 Total: " + productos.length + " productos generados");