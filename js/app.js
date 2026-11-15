/* === CONFIGURACIÓN Y ESTADO === */
let todosProductos = [];
let categoriaActual = "all";
let textoBusqueda = "";
let ordenActual = "default";
let productoSeleccionado = null;

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const tabs = $("tabs");
const buscador = $("buscador");
const ordenar = $("ordenar");
const contador = $("contador");
const modal = $("modal");
const formReserva = $("formReserva");

// Buscador
const searchWrapper = $("searchWrapper");
const searchBtn = $("searchBtn");
const navRow = $("navRow");

searchBtn.addEventListener("click", () => {
  searchWrapper.classList.add("active");
  navRow.classList.add("searching");
  buscador.focus();
});
buscador.addEventListener("blur", () => {
  if (buscador.value.trim() === "") {
    searchWrapper.classList.remove("active");
    navRow.classList.remove("searching");
  }
});

// Tema Oscuro / Claro
const themeToggle = $("themeToggle");
const themeIcon = $("themeIcon");
const htmlTag = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "dark";
htmlTag.setAttribute("data-theme", savedTheme);
themeIcon.textContent = savedTheme === "dark" ? "dark_mode" : "light_mode";

themeToggle.addEventListener("click", () => {
  const current = htmlTag.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  htmlTag.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  themeIcon.textContent = next === "dark" ? "dark_mode" : "light_mode";
});

// Zoom
function abrirZoom(src) { $("imgZoom").src = src; $("modalZoom").classList.add("activo"); }
function cerrarZoom() { $("modalZoom").classList.remove("activo"); }
window.abrirZoom = abrirZoom;
window.cerrarZoom = cerrarZoom;

/* === CARGAR DATOS (Protegido contra errores) === */
async function iniciar() {
  try {
    // 1. Cargar productos
    const resProd = await fetch("productos.json", { cache: "no-store" });
    if (!resProd.ok) throw new Error("No se encontró productos.json");
    const rawProd = await resProd.json();

    // 2. Intentar cargar configuración (si falla, usamos valores por defecto)
    let config = { productos: {}, carrusel: [] };
    try {
      const resConfig = await fetch("config.json", { cache: "no-store" });
      if (resConfig.ok) {
        config = await resConfig.json();
      }
    } catch (e) {
      console.warn("No hay config.json, usando valores por defecto.");
    }

    // 3. Procesar productos (filtrar ocultos y aplicar config)
    todosProductos = rawProd.filter(p => {
      const id = `${p.categoria}/${p.proveedor}/${p.archivo}`;
      const cfg = config.productos[id];
      return cfg ? cfg.visible : true; // Si no hay config, se muestra
    }).map((p) => {
      const id = `${p.categoria}/${p.proveedor}/${p.archivo}`;
      const cfg = config.productos[id] || { descuento: 10, disponible: true };
      
      // Cálculo del precio tachado basado en el descuento ficticio
      const descuento = cfg.descuento || 0;
      const precioOriginal = descuento > 0 ? Math.round(p.precio / (1 - descuento / 100)) : p.precio;

      return { 
        ...p, 
        descuento: descuento, 
        disponible: cfg.disponible,
        precioFinal: p.precio, 
        precioOriginal: precioOriginal
      };
    });

    generarBotonesCategorias();
    renderizar();
    iniciarAlternanciaBadges();
    initCarrusel(config.carrusel || []);
    
  } catch (err) {
    console.error("Error crítico:", err);
    grid.innerHTML = '<div class="vacio"><h3>⚠️ Sin productos</h3><p>Ejecuta actualizar.bat en el panel</p></div>';
  }
}

/* === CARRUSEL DINÁMICO === */
function initCarrusel(slides) {
  const track = $("carruselTrack");
  const dotsCont = $("carruselDots");
  track.innerHTML = ""; dotsCont.innerHTML = "";
  
  const visibles = slides.filter(s => s.visible);
  if (visibles.length === 0) {
    document.querySelector(".carrusel-container").style.display = "none";
    return;
  }
  
  document.querySelector(".carrusel-container").style.display = "block";

  visibles.forEach((s, i) => {
    const img = document.createElement("img");
    img.src = `img/carusel/${s.archivo}`;
    track.appendChild(img);

    const dot = document.createElement("div");
    dot.className = `dot ${i === 0 ? "active" : ""}`;
    dotsCont.appendChild(dot);
  });

  let index = 0;
  if (visibles.length > 1) {
    setInterval(() => {
      index = (index + 1) % visibles.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === index));
    }, 4000);
  }
}

/* === UTILIDADES Y LÓGICA === */
const hashString = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return Math.abs(h); };
const debounce = (fn, delay) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; };

function generarIdPedido() {
  const hoy = new Date();
  const fecha = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
  const clave = "pedido_" + fecha;
  const prev = localStorage.getItem(clave);
  if (prev === null) { const inicial = 1 + Math.floor(Math.random() * 99); localStorage.setItem(clave, String(inicial)); return fecha + "_" + inicial; }
  let siguiente = parseInt(prev, 10) + 1; if (siguiente > 99) siguiente = 1;
  localStorage.setItem(clave, String(siguiente)); return fecha + "_" + siguiente;
}

function generarBotonesCategorias() {
  const categorias = [...new Set(todosProductos.map(p => p.categoria))];
  const iconos = { "electrodomesticos": "kitchen", "transporte": "directions_car", "celulares": "smartphone", "accesorios": "headphones", "pcylaptops": "laptop_mac" };
  
  tabs.innerHTML = '<button class="tab active" data-cat="all"><span class="material-symbols-rounded">grid_view</span> Todos</button>';
  categorias.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab"; btn.dataset.cat = cat;
    btn.innerHTML = `<span class="material-symbols-rounded">${iconos[cat] || "category"}</span> ${cat.replace(/-/g, ' ')}`;
    tabs.appendChild(btn);
  });
  
  tabs.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.target.closest('.tab');
      tabs.querySelector(".tab.active")?.classList.remove("active");
      target.classList.add("active");
      categoriaActual = target.dataset.cat;
      renderizar();
    });
  });
}

function iniciarAlternanciaBadges() {
  let mostrar = false;
  setInterval(() => {
    mostrar = !mostrar;
    document.querySelectorAll(".badge-descuento").forEach(b => {
      if (b.dataset.disponible === "false") {
        b.textContent = "AGOTADO"; 
        b.style.background = "linear-gradient(135deg, #6b7280, #4b5563)"; 
        b.classList.remove("mostrar-disponible");
      } else if (mostrar) { 
        b.textContent = "DISPONIBLE"; 
        b.style.background = ""; // Restaurar gradiente verde original
        b.classList.add("mostrar-disponible"); 
      } else { 
        b.textContent = "-" + b.dataset.descuento + "%"; 
        b.style.background = ""; // Restaurar gradiente rojo original
        b.classList.remove("mostrar-disponible"); 
      }
    });
  }, 3000);
}

function productosFiltrados() {
  let l = todosProductos;
  if (categoriaActual !== "all") l = l.filter(p => p.categoria === categoriaActual);
  if (textoBusqueda) { const q = textoBusqueda.toLowerCase(); l = l.filter(p => p.nombre.toLowerCase().includes(q) || p.proveedor.toLowerCase().includes(q)); }
  if (ordenActual === "precio-asc") l.sort((a, b) => a.precioFinal - b.precioFinal);
  else if (ordenActual === "precio-desc") l.sort((a, b) => b.precioFinal - a.precioFinal);
  else if (ordenActual === "nombre") l.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return l;
}

function renderizar() {
  const lista = productosFiltrados();
  const frag = document.createDocumentFragment();
  contador.textContent = lista.length + " productos";
  
  if (lista.length === 0) { grid.innerHTML = '<div class="vacio"><h3>😕 Sin resultados</h3></div>'; return; }

  lista.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";
    
    // Deshabilitar botón de reserva si no está disponible
    const btnReservar = p.disponible 
      ? `<button class="btn-reservar" onclick="abrirModal(${JSON.stringify(p).replace(/"/g, '&quot;')})"><span class="material-symbols-rounded">shopping_cart</span> Reservar</button>`
      : `<button class="btn-reservar" disabled style="opacity:0.5; cursor:not-allowed"><span class="material-symbols-rounded">block</span> Agotado</button>`;

    card.innerHTML = `
      <div class="card-img-wrap" onclick="abrirZoom('${p.imagen}')">
        <img src="${p.imagen}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-nombre">${p.nombre}</h3>
        <div class="precios">
          <div class="precio-info">
            <span class="precio-original">$${p.precioOriginal.toLocaleString("es-CO")}</span>
            <span class="precio-final">$${p.precioFinal.toLocaleString("es-CO")}</span>
          </div>
          <div class="badge-descuento" data-descuento="${p.descuento}" data-disponible="${p.disponible}">-${p.descuento}%</div>
        </div>
        <div class="card-botones">
          <button class="btn-detalles" onclick="abrirDetalles(${JSON.stringify(p).replace(/"/g, '&quot;')})"><span class="material-symbols-rounded">info</span> Info</button>
          ${btnReservar}
        </div>
      </div>`;
    frag.appendChild(card);
  });
  grid.replaceChildren(frag);
}

/* === MODALES === */
function abrirModal(producto) {
  productoSeleccionado = producto;
  $("modalProducto").innerHTML = `<p><strong>${producto.nombre}</strong></p><p>$${producto.precioFinal.toLocaleString("es-CO")}</p>`;
  modal.classList.add("activo");
  document.body.style.overflow = "hidden";
}
function cerrarModal() {
  modal.classList.remove("activo");
  formReserva.reset();
  $("camposDomicilio").style.display = "none";
  document.body.style.overflow = "";
}
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;

async function abrirDetalles(producto) {
  $("detalleTitulo").textContent = producto.nombre;
  $("detalleContenido").innerHTML = '<p class="cargando">Cargando...</p>';
  $("modalDetalles").classList.add("activo");
  document.body.style.overflow = "hidden";
  const ruta = producto.imagen.replace(/\.[^/.]+$/, ".txt");
  try {
    const res = await fetch(ruta + "?t=" + Date.now());
    if (!res.ok) throw new Error();
    const texto = await res.text();
    $("detalleContenido").innerHTML = texto.split(/\r?\n/).filter(l => l.trim()).map(l => `<p>${l}</p>`).join("");
  } catch {
    $("detalleContenido").innerHTML = '<p class="sin-detalles">Sin detalles disponibles.</p>';
  }
}
window.abrirDetalles = abrirDetalles;
window.cerrarDetalles = () => { $("modalDetalles").classList.remove("activo"); document.body.style.overflow = ""; };

/* === EVENTOS === */
$("cerrarModal").onclick = cerrarModal;
$("cerrarDetalles").onclick = window.cerrarDetalles;

$("clienteMetodo").addEventListener("change", (e) => {
  const esDomicilio = e.target.value === "domicilio";
  $("camposDomicilio").style.display = esDomicilio ? "flex" : "none";
});

$("buscador").addEventListener("input", debounce((e) => { textoBusqueda = e.target.value; renderizar(); }, 200));
$("ordenar").addEventListener("change", (e) => { ordenActual = e.target.value; renderizar(); });

formReserva.onsubmit = (e) => {
  e.preventDefault();
  if (!productoSeleccionado) return;
  // Validaciones omitidas aquí por brevedad (mantén las que tenías)
  const cliente = {
    nombre: $("clienteNombre").value.trim(), telefono: $("clienteTelefono").value.trim(),
    cantidad: parseInt($("clienteCantidad").value, 10), metodo: $("clienteMetodo").value,
    carne: $("clienteMetodo").value === "domicilio" ? $("clienteCarne").value.trim() : "",
    direccion: $("clienteMetodo").value === "domicilio" ? $("clienteDireccion").value.trim() : "",
    idPedido: generarIdPedido()
  };
  window.open(generarLinkWhatsApp(productoSeleccionado, cliente), "_blank");
  cerrarModal();
};

iniciar();