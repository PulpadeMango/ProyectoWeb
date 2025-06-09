let todosLosHoteles = []; // Almacena todos los hoteles cargados (normal o "del mal").
// Recupera el estado del "modo malvado" desde el almacenamiento local.
let modoMalActivo = localStorage.getItem("modoMalvado") === "activo";

document.addEventListener("DOMContentLoaded", () => {
    const titulo = document.getElementById("titulo-easter");
    const audio = new Audio("audio-easteregg.mp3"); // Audio para el Easter Egg.

    titulo.style.cursor = "pointer"; // Indica que el título es interactivo.

    // Aplica los estilos visuales del "modo malvado" si estaba activo previamente.
    if (modoMalActivo) {
        activarModoMalvadoVisual();
    }

    // Listener para activar/desactivar el "modo malvado" al hacer clic en el título.
    titulo.addEventListener("click", () => {
        modoMalActivo = !modoMalActivo; // Alterna el estado del modo.

        if (modoMalActivo) {
            audio.play().catch(err => console.error("No se pudo reproducir el audio:", err)); // Intenta reproducir el audio.
            titulo.classList.add("sacudir"); // Agrega clase para efecto visual.
            setTimeout(() => titulo.classList.remove("sacudir"), 1000); // Remueve la clase después de un segundo.
            localStorage.setItem("modoMalvado", "activo"); // Guarda el estado en localStorage.
            activarModoMalvadoVisual(); // Aplica los estilos visuales.
            cargarHotelesDelMal(); // Carga los hoteles de la tabla "del mal".
        } else {
            localStorage.removeItem("modoMalvado"); // Elimina el estado de localStorage.
            desactivarModoMalvadoVisual(); // Quita los estilos visuales.
            cargarHotelesNormales(); // Carga los hoteles normales.
        }
    });

    // Verifica el estado de la sesión del usuario y actualiza la UI de navegación.
    verificarSesionYActualizarUI();

    // Carga inicial de hoteles basada en el estado del "modo malvado".
    if (modoMalActivo) {
        cargarHotelesDelMal();
    } else {
        cargarHotelesNormales();
    }
});

/**
 * Aplica estilos visuales para el "modo malvado".
 */
function activarModoMalvadoVisual() {
    document.body.classList.add("modo-oscuro", "cambio-cursor");
    const titulo = document.getElementById("titulo-easter");
    if (titulo) titulo.textContent = "Resident Evil"; // Cambia el texto del título.
}

/**
 * Remueve los estilos visuales del "modo malvado".
 */
function desactivarModoMalvadoVisual() {
    document.body.classList.remove("modo-oscuro", "cambio-cursor");
    const titulo = document.getElementById("titulo-easter");
    if (titulo) titulo.textContent = "Hoteles la Residencia del Bien"; // Restaura el texto del título.
}

/**
 * Carga hoteles desde la tabla "hoteles_del_mal" y actualiza los carruseles.
 */
function cargarHotelesDelMal() {
    fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php?tabla=hoteles_del_mal")
        .then(res => res.json())
        .then(hotelesMal => {
            todosLosHoteles = hotelesMal; // Actualiza la lista global de hoteles.
            mostrarHoteles(hotelesMal); // Muestra los hoteles en la sección principal.

            // Ordena y renderiza los carruseles con datos de hoteles "del mal".
            const destacados = [...hotelesMal].sort((a, b) => b.precio - a.precio).slice(0, 5);
            renderCarrusel(destacados, "carrusel-destacados");

            const ofertas = [...hotelesMal].sort((a, b) => a.precio - b.precio).slice(0, 5);
            renderCarrusel(ofertas, "carrusel-ofertas");

            const aleatorios = hotelesMal.sort(() => 0.5 - Math.random()).slice(0, 5);
            renderCarrusel(aleatorios, "carrusel-experiencias");
        })
        .catch(err => console.error("Error al cargar hoteles del mal:", err));
}

/**
 * Carga hoteles normales desde la base de datos, calcula calificaciones y actualiza carruseles.
 */
function cargarHotelesNormales() {
    fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php")
        .then(res => res.json())
        .then(hoteles => {
            todosLosHoteles = hoteles; // Actualiza la lista global de hoteles.

            // Agrega un listener para el botón "Enter" en el campo de búsqueda.
            document.getElementById("busqueda").addEventListener("keydown", e => {
                if (e.key === "Enter") filtrarHoteles();
            });

            llenarFiltroPais(hoteles); // Rellena el filtro de países.

            // Calcula la calificación promedio para cada hotel a partir de sus reseñas.
            hoteles.forEach(hotel => {
                try {
                    const reseñas = JSON.parse(hotel.reseñas || "[]");
                    const totalEstrellas = reseñas.reduce((acc, r) => acc + r.estrellas, 0);
                    hotel.calificacion = reseñas.length ? totalEstrellas / reseñas.length : 0;
                } catch (e) {
                    hotel.calificacion = 0; // Si hay error en las reseñas, la calificación es 0.
                }
            });

            mostrarHoteles(hoteles); // Muestra los hoteles en la sección principal.

            // Ordena y renderiza los carruseles con datos de hoteles normales.
            const destacados = [...hoteles].sort((a, b) => b.calificacion - a.calificacion).slice(0, 5);
            renderCarrusel(destacados, "carrusel-destacados");

            const ofertas = [...hoteles].sort((a, b) => a.precio - b.precio).slice(0, 5);
            renderCarrusel(ofertas, "carrusel-ofertas");

            const aleatorios = hoteles.sort(() => 0.5 - Math.random()).slice(0, 5);
            renderCarrusel(aleatorios, "carrusel-experiencias");
        })
        .catch(error => console.error("Error al cargar hoteles:", error));
}

/**
 * Verifica si el usuario ha iniciado sesión y actualiza la interfaz de usuario de la barra de navegación.
 */
function verificarSesionYActualizarUI() {
    fetch("ver_sesion.php")
        .then(response => response.json())
        .then(data => {
            const authControls = document.getElementById("auth-controls");
            if (authControls) {
                // Actualiza el contenido de authControls según el estado de autenticación.
                authControls.innerHTML = data.autenticado
                    ? `<span class="user-info"><i class="user-icon">👤</i> <span>Hola, ${data.nombre}</span></span><a href="logout.php" class="logout-btn">Cerrar sesión</a>`
                    : `<a href="login.php" class="login-btn">Iniciar sesión</a>`;
            }
        })
        .catch(error => {
            console.error("Error al verificar sesión:", error);
            const authControls = document.getElementById("auth-controls");
            if (authControls) {
                authControls.innerHTML = `<a href="login.php" class="login-btn">Iniciar sesión</a>`; // Muestra siempre "Iniciar sesión" en caso de error.
            }
        });
}

/**
 * Muestra una lista de hoteles en el contenedor principal.
 * @param {Array} hoteles - Array de objetos hotel a mostrar.
 */
function mostrarHoteles(hoteles) {
    const contenedor = document.getElementById("lista-hoteles");
    if (!contenedor) return; // Sale si el contenedor no existe (ej. en otras páginas).
    contenedor.innerHTML = ""; // Limpia el contenido existente.

    // Determina si se debe pasar el parámetro de tabla para el "modo malvado".
    const tablaParam = modoMalActivo ? "&tabla=hoteles_del_mal" : "";

    hoteles.forEach(hotel => {
        const div = document.createElement("div");
        div.classList.add("hotel");
        div.innerHTML = `
            <a href="hotel.html?id=${hotel.id}${tablaParam}" class="enlace-hotel">
                <div class="imagen-hotel">
                    <img src="${hotel.imagen_url}" alt="Imagen de ${hotel.nombre}">
                </div>
                <h3 class="titulo-hotel">${hotel.nombre}</h3>
                <p><strong>Ubicación:</strong> ${hotel.ciudad}, ${hotel.pais}</p>
                <p><strong>Precio:</strong> $${hotel.precio} USD</p>
                <p>${hotel.descripcion}</p>
            </a>
        `;
        contenedor.appendChild(div);
    });
}

/**
 * Filtra los hoteles mostrados basándose en la búsqueda por texto, país y rango de precio.
 */
function filtrarHoteles() {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const pais = document.getElementById("filtro-pais").value;
    const precioMin = parseFloat(document.getElementById("precio-min").value) || 0;
    const precioMax = parseFloat(document.getElementById("precio-max").value) || Infinity;

    // Filtra la lista global de hoteles según los criterios.
    const resultados = todosLosHoteles.filter(hotel => {
        const coincideNombre = hotel.nombre.toLowerCase().includes(texto);
        const coincidePais = pais === "" || hotel.pais === pais;
        const coincidePrecio = hotel.precio >= precioMin && hotel.precio <= precioMax;
        return coincideNombre && coincidePais && coincidePrecio;
    });

    const seccion = document.getElementById("resultados"); // Sección de resultados de búsqueda.
    const contenedor = document.getElementById("lista-hoteles"); // Contenedor dentro de la sección de resultados.
    contenedor.innerHTML = ""; // Limpia el contenido actual.

    const tablaParam = modoMalActivo ? "&tabla=hoteles_del_mal" : "";

    if (resultados.length > 0) {
        seccion.style.display = "block"; // Muestra la sección de resultados.
        resultados.forEach(hotel => {
            const div = document.createElement("div");
            div.classList.add("hotel");
            div.innerHTML = `
                <a href="hotel.html?id=${hotel.id}${tablaParam}" class="enlace-hotel">
                    <div class="imagen-hotel">
                        <img src="${hotel.imagen_url}" alt="Imagen de ${hotel.nombre}">
                    </div>
                    <h3 class="titulo-hotel">${hotel.nombre}</h3>
                    <p><strong>Ubicación:</strong> ${hotel.ciudad}, ${hotel.pais}</p>
                    <p><strong>Precio:</strong> $${hotel.precio} USD</p>
                    <p>${hotel.descripcion}</p>
                </a>
            `;
            contenedor.appendChild(div);
        });
    } else {
        seccion.style.display = "block"; // Muestra la sección aunque no haya resultados.
        contenedor.innerHTML = `<p style="text-align:center; color:#666;">No se encontraron hoteles que coincidan con la búsqueda.</p>`;
    }
}

/**
 * Reinicia todos los filtros de búsqueda y oculta la sección de resultados.
 */
function reiniciarFiltros() {
    document.getElementById("busqueda").value = "";
    document.getElementById("filtro-pais").value = "";
    document.getElementById("precio-min").value = "";
    document.getElementById("precio-max").value = "";
    document.getElementById("resultados").style.display = "none"; // Oculta la sección de resultados.
    filtrarHoteles(); // Vuelve a filtrar para mostrar todos los hoteles.
}

/**
 * Rellena el select de filtro por país con los países únicos de los hoteles.
 * @param {Array} hoteles - Lista de hoteles para extraer los países.
 */
function llenarFiltroPais(hoteles) {
    // Obtiene una lista de países únicos y los ordena alfabéticamente.
    const paises = [...new Set(hoteles.map(h => h.pais))].sort();
    const select = document.getElementById("filtro-pais");
    select.innerHTML = `<option value="">Todos los países</option>`; // Opción por defecto.
    paises.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.textContent = p;
        select.appendChild(option);
    });
}

/**
 * Renderiza tarjetas de hoteles dentro de un elemento de carrusel específico.
 * @param {Array} lista - Lista de hoteles para mostrar en el carrusel.
 * @param {string} idContenedor - ID del elemento HTML donde se renderizará el carrusel.
 */
function renderCarrusel(lista, idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const tablaParam = modoMalActivo ? "&tabla=hoteles_del_mal" : "";

    lista.forEach(hotel => {
        const div = document.createElement("div");
        div.classList.add("hotel");
        div.innerHTML = `
            <a href="hotel.html?id=${hotel.id}${tablaParam}" class="enlace-hotel">
                <div class="imagen-hotel">
                    <img src="${hotel.imagen_url}" alt="Imagen de ${hotel.nombre}">
                </div>
                <h3>${hotel.nombre}</h3>
                <p><strong>${hotel.ciudad}, ${hotel.pais}</strong></p>
                <p>💵 $${hotel.precio} USD</p>
                <p>⭐ ${hotel.calificacion?.toFixed(1) || "0.0"} / 5</p>
            </a>
        `;
        contenedor.appendChild(div);
    });
}

/**
 * Mueve un carrusel horizontalmente.
 * @param {string} id - Parte del ID del carrusel (ej. "destacados", "ofertas").
 * @param {number} direccion - Dirección del movimiento (-1 para izquierda, 1 para derecha).
 */
function moverCarrusel(id, direccion) {
    const carrusel = document.getElementById("carrusel-" + id);
    // Calcula el ancho de una tarjeta de hotel más el margen.
    const ancho = carrusel.querySelector(".hotel")?.offsetWidth || 300;
    carrusel.scrollBy({
        left: direccion * (ancho + 20), // 20px de margen (ajustar si es necesario).
        behavior: "smooth"
    });
}