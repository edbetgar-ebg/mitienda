/* === CONFIG === */
const INTERVALO_BADGE = 3000;
const DEBOUNCE_VALIDACION = 200;

/* === ESTADO === */
let todosProductos = [];
let categoriaActual = "all";
let textoBusqueda = "";
let ordenActual = "default";
let productoSeleccionado = null;

/* === CACHE DOM === */
const $ = (id) => document.getElementById(id);
const grid = $("grid");
const tabs = $("tabs");
const buscador = $("buscador");
const ordenar = $("ordenar");
const contador = $("contador");
const modal = $("modal");
const modalProducto = $("modalProducto");
const cerrarModalBtn = $("cerrarModal");
const formReserva = $("formReserva");
const clienteMetodo = $("clienteMetodo");
const camposDomicilio = $("camposDomicilio");
const clienteCarne = $("clienteCarne");
const clienteDireccion = $("clienteDireccion");
const clienteNombre = $("clienteNombre");
const clienteTelefono = $("clienteTelefono");
const clienteCantidad = $("clienteCantidad");
const modalDetalles = $("modalDetalles");
const detalleTitulo = $("detalleTitulo");
const detalleContenido = $("detalleContenido");
const cerrarDetallesBtn = $("cerrarDetalles");

/* === UTILIDADES === */
const hashString = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const calcularDescuento = (id) => 3 + (hashString(id) % 13);

const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

/* === ID DE PEDIDO === */
function generarIdPedido() {
  const hoy = new Date();
  const fecha =
    hoy.getFullYear() +
    String(hoy.getMonth() + 1).padStart(2, "0") +
    String(hoy.getDate()).padStart(2, "0");
  const clave = "pedido_" + fecha;
  const prev = localStorage.getItem(clave);
  if (prev === null) {
    const inicial = 1 + Math.floor(Math.random() * 99);
    localStorage.setItem(clave, String(inicial));
    return fecha + "_" + inicial;
  }
  let siguiente = parseInt(prev, 10) + 1;
  if (siguiente > 99) siguiente = 1;
  localStorage.setItem(clave, String(siguiente));
  return fecha + "_" + siguiente;
}

/* ============================================================
   SISTEMA DE ESTADOS VISUALES
   ============================================================ */
const ESTADO_CLASES = ["input-ok", "input-error"];

function aplicarEstado(campo, estado, mensaje) {
  const span = $("err-" + campo);
  const input = $("cliente" + campo.charAt(0).toUpperCase() + campo.slice(1));
  if (!input) return;

  input.classList.remove(...ESTADO_CLASES);

  if (estado === "ok") {
    input.classList.add("input-ok");
    if (span) span.textContent = "";
  } else if (estado === "error") {
    input.classList.add("input-error");
    if (span) span.textContent = mensaje || "";
  } else {
    if (span) span.textContent = "";
  }
}

/* ============================================================
   VALIDACIONES
   ============================================================ */
function validarNombre(valor) {
  const v = (valor || "").trim();
  if (!v) return "El nombre es obligatorio.";
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(v)) return "Solo letras y espacios.";
  const palabras = v.split(/\s+/).filter(Boolean);
  if (palabras.length < 3) return "Escribe al menos 3 palabras.";
  if (palabras.some((p) => p.length < 3)) return "Cada palabra, mínimo 3 letras.";
  return "";
}

function validarTelefono(valor) {
  const v = (valor || "").trim();
  if (!v) return "El teléfono es obligatorio.";
  if (!/^\d{8}$/.test(v)) return "Deben ser exactamente 8 dígitos.";
  return "";
}

function validarCantidad(valor) {
  const n = parseInt(valor, 10);
  if (isNaN(n) || n < 1) return "La cantidad debe ser 1 o más.";
  return "";
}

function validarMetodo(valor) {
  if (!valor) return "Selecciona un método de entrega.";
  return "";
}

function validarCarne(valor) {
  const v = (valor || "").trim();
  if (!v) return "El carné es obligatorio.";
  if (!/^\d{11}$/.test(v)) return "Deben ser 11 dígitos.";

  const aa = parseInt(v.substring(0, 2), 10);
  const mm = parseInt(v.substring(2, 4), 10);
  const dd = parseInt(v.substring(4, 6), 10);
  const anio = aa >= 25 ? 1900 + aa : 2000 + aa;

  if (mm < 1 || mm > 12) return "Mes inválido en el carné.";
  if (dd < 1 || dd > 31) return "Día inválido en el carné.";

  const fechaNac = new Date(anio, mm - 1, dd);
  if (
    fechaNac.getFullYear() !== anio ||
    fechaNac.getMonth() !== mm - 1 ||
    fechaNac.getDate() !== dd
  ) {
    return "Fecha inválida en el carné.";
  }

  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const m = hoy.getMonth() - fechaNac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) edad--;

  if (edad < 20) return "Debes tener al menos 20 años.";
  return "";
}

function validarDireccion(valor) {
  const v = (valor || "").trim();
  if (!v) return "La dirección es obligatoria.";
  if (v.length < 20) return "Dirección muy corta. Usa el formato completo.";

  const regex = /^\s*calle\s+.+?\s+#\s*\d+\s+entre\s+.+?\s+y\s+.+?\s+(rpto\.?|reparto)\s+.+$/i;
  if (!regex.test(v)) {
    return "Formato: Calle [nombre] # [número] entre [calle1] y [calle2] Rpto [reparto]";
  }
  return "";
}

function validarFormulario() {
  let ok = true;

  const eN = validarNombre(clienteNombre.value);
  aplicarEstado("nombre", eN ? "error" : "ok", eN);
  if (eN) ok = false;

  const eT = validarTelefono(clienteTelefono.value);
  aplicarEstado("telefono", eT ? "error" : "ok", eT);
  if (eT) ok = false;

  const eC = validarCantidad(clienteCantidad.value);
  aplicarEstado("cantidad", eC ? "error" : "ok", eC);
  if (eC) ok = false;

  const eM = validarMetodo(clienteMetodo.value);
  aplicarEstado("metodo", eM ? "error" : "ok", eM);
  if (eM) ok = false;

  if (clienteMetodo.value === "domicilio") {
    const eK = validarCarne(clienteCarne.value);
    aplicarEstado("carne", eK ? "error" : "ok", eK);
    if (eK) ok = false;

    const eD = validarDireccion(clienteDireccion.value);
    aplicarEstado("direccion", eD ? "error" : "ok", eD);
    if (eD) ok = false;
  } else {
    aplicarEstado("carne", "neutro");
    aplicarEstado("direccion", "neutro");
  }

  return ok;
}

/* ============================================================
   CARGAR PRODUCTOS Y CATEGORÍAS
   ============================================================ */
async function iniciar() {
  try {
    const res = await fetch("productos.json", { cache: "no-store" });
    const raw = await res.json();
    
    // 1. Procesar productos
    todosProductos = raw.map((p) => {
      const descuento = calcularDescuento(p.id);
      return {
        ...p,
        descuento,
        precioFinal: p.precio,
        precioOriginal: Math.round(p.precio / (1 - descuento / 100)),
      };
    });

    // 2. Generar los botones de categorías dinámicamente
    generarBotonesCategorias();

    // 3. Renderizar
    renderizar();
    iniciarAlternanciaBadges();
  } catch (err) {
    console.error("Error cargando productos.json", err);
    grid.innerHTML =
      '<div class="vacio"><h3>⚠️ Sin productos</h3><p>Ejecuta actualizar.bat</p></div>';
  }
}

/* === GENERAR CATEGORÍAS DINÁMICAS === */
function generarBotonesCategorias() {
  // Obtenemos las categorías únicas del JSON
  const categorias = [...new Set(todosProductos.map(p => p.categoria))];
  
  // Limpiamos los tabs, dejando solo el de "Todos"
  tabs.innerHTML = '<button class="tab active" data-cat="all">Todos</button>';

  // Diccionario de íconos (si no está en la lista, se pone el genérico 📦)
  const iconos = {
    "electrodomesticos": "🔌",
    "transporte": "🚗",
    "celulares": "📱",
    "accesorios": "🎧",
    "pcylaptops": "💻"
  };

  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab";
    btn.dataset.cat = cat;
    
    // Formatear nombre: "pcylaptops" -> "Pcylaptops"
    const nombreBonito = cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const icono = iconos[cat] || "📦";
    
    btn.textContent = `${icono} ${nombreBonito}`;
    tabs.appendChild(btn);
  });

  // Volver a asignar el evento click a todos los botones
  tabs.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      tabs.querySelector(".tab.active")?.classList.remove("active");
      e.target.classList.add("active");
      categoriaActual = e.target.dataset.cat;
      renderizar();
    });
  });
}

/* === ALTERNANCIA DE BADGES === */
function iniciarAlternanciaBadges() {
  let mostrarDisponible = false;
  setInterval(() => {
    mostrarDisponible = !mostrarDisponible;
    document.querySelectorAll(".badge-descuento").forEach((b) => {
      if (mostrarDisponible) {
        b.textContent = "DISPONIBLE";
        b.classList.add("mostrar-disponible");
      } else {
        b.textContent = "-" + b.dataset.descuento + "%";
        b.classList.remove("mostrar-disponible");
      }
    });
  }, INTERVALO_BADGE);
}

/* === FILTRAR Y ORDENAR === */
function productosFiltrados() {
  let lista = todosProductos;
  if (categoriaActual !== "all") {
    lista = lista.filter((p) => p.categoria === categoriaActual);
  }
  if (textoBusqueda) {
    const q = textoBusqueda.toLowerCase();
    lista = lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.proveedor.toLowerCase().includes(q)
    );
  }
  if (ordenActual === "precio-asc")  lista.sort((a, b) => a.precioFinal - b.precioFinal);
  else if (ordenActual === "precio-desc") lista.sort((a, b) => b.precioFinal - a.precioFinal);
  else if (ordenActual === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return lista;
}

/* === RENDER === */
function renderizar() {
  const lista = productosFiltrados();
  const frag = document.createDocumentFragment();

  if (lista.length === 0) {
    const div = document.createElement("div");
    div.className = "vacio";
    div.innerHTML = "<h3>😕 Sin productos</h3><p>Prueba otra búsqueda.</p>";
    grid.replaceChildren(div);
    contador.textContent = "";
    return;
  }

  contador.textContent =
    lista.length + " producto" + (lista.length !== 1 ? "s" : "") +
    " disponible" + (lista.length !== 1 ? "s" : "");

  lista.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML =
      '<div class="card-img-wrap">' +
        '<span class="badge-descuento" data-descuento="' + p.descuento + '">-' + p.descuento + '%</span>' +
        '<img src="' + p.imagen + '" alt="' + p.nombre + '" loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-nombre">' + p.nombre + '</h3>' +
        '<div class="precios">' +
          '<span class="precio-original">$' + p.precioOriginal.toLocaleString("es-CO") + '</span>' +
          '<span class="precio-final">$' + p.precioFinal.toLocaleString("es-CO") + '</span>' +
        '</div>' +
        '<div class="card-botones">' +
          '<button class="btn-detalles" type="button">📄 Detalles</button>' +
          '<button class="btn-reservar" type="button">💬 Reservar</button>' +
        '</div>' +
      '</div>';
    card.querySelector(".btn-reservar").addEventListener("click", () => abrirModal(p));
    card.querySelector(".btn-detalles").addEventListener("click", () => abrirDetalles(p));
    frag.appendChild(card);
  });

  grid.replaceChildren(frag);
}

/* === MODAL RESERVA === */
function abrirModal(producto) {
  productoSeleccionado = producto;
  modalProducto.innerHTML =
    "<p><strong>" + producto.nombre + "</strong></p>" +
    "<p>$" + producto.precioFinal.toLocaleString("es-CO") +
      ' <span style="color:#9ca3af;text-decoration:line-through;font-size:.85em">$' +
      producto.precioOriginal.toLocaleString("es-CO") + "</span></p>" +
    '<p style="color:#10b981;font-weight:700">-' + producto.descuento + "% de descuento</p>";
  modal.classList.add("activo");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  modal.classList.remove("activo");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  formReserva.reset();
  camposDomicilio.style.display = "none";
  ["nombre", "telefono", "cantidad", "metodo", "carne", "direccion"].forEach(
    (c) => aplicarEstado(c, "neutro")
  );
  productoSeleccionado = null;
}

/* === MODAL DETALLES === */
async function abrirDetalles(producto) {
  detalleTitulo.textContent = producto.nombre;
  detalleContenido.innerHTML = '<p class="cargando">Cargando...</p>';
  modalDetalles.classList.add("activo");
  modalDetalles.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const ruta = producto.imagen.replace(/\.[^/.]+$/, ".txt");
  try {
    const res = await fetch(ruta + "?t=" + Date.now());
    if (!res.ok) throw new Error();
    const texto = await res.text();
    const parrafos = texto
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => "<p>" + l + "</p>")
      .join("");
    detalleContenido.innerHTML = parrafos || "<p>Sin descripción.</p>";
  } catch {
    detalleContenido.innerHTML = '<p class="sin-detalles">Sin detalles disponibles.</p>';
  }
}

function cerrarDetalles() {
  modalDetalles.classList.remove("activo");
  modalDetalles.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ============================================================
   VALIDACIÓN EN VIVO
   ============================================================ */
function configurarValidacionViva(input, funcionValidadora, nombreCampo) {
  const run = () => {
    const valor = input.value;
    if (!valor || valor.trim() === "") {
      aplicarEstado(nombreCampo, "neutro");
      return;
    }
    const err = funcionValidadora(valor);
    aplicarEstado(nombreCampo, err ? "error" : "ok", err);
  };
  const debounced = debounce(run, DEBOUNCE_VALIDACION);
  input.addEventListener("input", debounced);
  input.addEventListener("blur", run);
}

configurarValidacionViva(clienteNombre, validarNombre, "nombre");
configurarValidacionViva(clienteTelefono, validarTelefono, "telefono");
configurarValidacionViva(clienteCantidad, validarCantidad, "cantidad");
configurarValidacionViva(clienteCarne, validarCarne, "carne");
configurarValidacionViva(clienteDireccion, validarDireccion, "direccion");

clienteMetodo.addEventListener("change", () => {
  const esDomicilio = clienteMetodo.value === "domicilio";
  camposDomicilio.style.display = esDomicilio ? "block" : "none";
  const err = validarMetodo(clienteMetodo.value);
  aplicarEstado("metodo", err ? "error" : "ok", err);
  if (!esDomicilio) {
    clienteCarne.value = "";
    clienteDireccion.value = "";
    aplicarEstado("carne", "neutro");
    aplicarEstado("direccion", "neutro");
  }
});

/* === EVENTOS UI === */
const buscadorDebounced = debounce((val) => {
  textoBusqueda = val;
  renderizar();
}, 200);
buscador.addEventListener("input", (e) => buscadorDebounced(e.target.value));

ordenar.addEventListener("change", (e) => {
  ordenActual = e.target.value;
  renderizar();
});

cerrarModalBtn.addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

cerrarDetallesBtn.addEventListener("click", cerrarDetalles);
modalDetalles.addEventListener("click", (e) => {
  if (e.target === modalDetalles) cerrarDetalles();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
    cerrarDetalles();
  }
});

/* === SUBMIT === */
formReserva.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;
  if (!productoSeleccionado) return;

  const cliente = {
    nombre: clienteNombre.value.trim(),
    telefono: clienteTelefono.value.trim(),
    cantidad: parseInt(clienteCantidad.value, 10),
    metodo: clienteMetodo.value,
    carne: clienteMetodo.value === "domicilio" ? clienteCarne.value.trim() : "",
    direccion: clienteMetodo.value === "domicilio" ? clienteDireccion.value.trim() : "",
    idPedido: generarIdPedido(),
  };

  window.open(generarLinkWhatsApp(productoSeleccionado, cliente), "_blank");
  cerrarModal();
});

/* === ARRANCAR === */
iniciar();