/* === CONFIGURACIÓN DE WHATSAPP === */
// CAMBIA ESTO POR TU NUMERO (con codigo de pais, sin + ni espacios)
const WHATSAPP_NUMERO = "+5354341857";

function generarLinkWhatsApp(producto, cliente) {
  const total = producto.precioFinal * cliente.cantidad;

  let metodoTexto = "";
  if (cliente.metodo === "domicilio") metodoTexto = "🚚 Contra entrega a domicilio";
  else if (cliente.metodo === "fisica") metodoTexto = "🏪 Compra fisica en establecimiento";
  else metodoTexto = cliente.metodo;

  let bloqueDomicilio = "";
  if (cliente.metodo === "domicilio") {
    bloqueDomicilio =
      "🆔 Carnet: " + cliente.carne + "\n" +
      "📍 Direccion: " + cliente.direccion + "\n" +
      "🏠 Zona: Santa Clara / Villa Clara / Cuba\n\n";
  }

  const sep = "➡️➡️➡️➡️➡️➡️➡️➡️\n";

  const mensaje =
    "✅ *NUEVA RESERVA #" + cliente.idPedido + "*\n\n" +
    "📱 Producto: " + producto.nombre + "\n" +
    "🔢 Cantidad: " + cliente.cantidad + "\n" +
    "💰 Precio unitario: $" + producto.precioFinal.toLocaleString("es-CO") + "\n" +
    "💵 TOTAL: $" + total.toLocaleString("es-CO") + "\n" +
    "🏷️ Descuento: -" + producto.descuento + "%\n\n" +
    sep +
    "🚚 *METODO DE ENTREGA*\n" +
    metodoTexto + "\n" +
    bloqueDomicilio +
    sep +
    "🙋 *CLIENTE*\n" +
    "👤 Nombre: " + cliente.nombre + "\n" +
    "📞 Telefono: " + cliente.telefono + "\n\n" +
    sep +
    "🔒 *INFO INTERNA (solo tu):*\n" +
    "📁 Categoria: " + producto.categoria + "\n" +
    "👤 Proveedor: " + producto.proveedor + "\n" +
    "🖼️ Archivo: " + producto.archivo + "\n\n" +
    "📝 Enviado desde la web MiTienda";

  return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensaje);
}
