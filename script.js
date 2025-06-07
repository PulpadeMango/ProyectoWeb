let todosLosHoteles = [];
let modoMalActivo = false;

document.addEventListener("DOMContentLoaded", () => {
  const titulo = document.getElementById("titulo-easter");
  const audio = new Audio("audio-easteregg.mp3");

  // Hacer el título clickeable
  titulo.style.cursor = "pointer";

  titulo.addEventListener("click", () => {
    if (!modoMalActivo) {
      modoMalActivo = true;

      audio.play().catch(err => console.error("No se pudo reproducir el audio:", err));
      titulo.classList.add("sacudir");
      setTimeout(() => titulo.classList.remove("sacudir"), 1000);

      document.body.classList.add("modo-oscuro", "cambio-cursor");
      document.getElementById("titulo-easter").textContent = "Resident Evil";

      // Cargar tabla alternativa
      fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php?tabla=hoteles_del_mal")
        .then(res => res.json())
        .then(hotelesMal => {
          todosLosHoteles = hotelesMal;
          mostrarHoteles(hotelesMal);

          const destacados = [...hotelesMal].sort((a, b) => b.precio - a.precio).slice(0, 5);
          renderCarrusel(destacados, "carrusel-destacados");

          const ofertas = [...hotelesMal].sort((a, b) => a.precio - b.precio).slice(0, 5);
          renderCarrusel(ofertas, "carrusel-ofertas");

          const aleatorios = hotelesMal.sort(() => 0.5 - Math.random()).slice(0, 5);
          renderCarrusel(aleatorios, "carrusel-experiencias");
        })
        .catch(err => console.error("Error al cargar hoteles del mal:", err));
    }
  });

  verificarSesionYActualizarUI();

  // Cargar hoteles normales por defecto
  fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php")
    .then(res => res.json())
    .then(hoteles => {
      todosLosHoteles = hoteles;

      document.getElementById("busqueda").addEventListener("keydown", function (e) {
        if (e.key === "Enter") filtrarHoteles();
      });

      llenarFiltroPais(hoteles);

      hoteles.forEach(hotel => {
        try {
          const reseñas = JSON.parse(hotel.reseñas || "[]");
          const totalEstrellas = reseñas.reduce((acc, r) => acc + r.estrellas, 0);
          hotel.calificacion = reseñas.length ? totalEstrellas / reseñas.length : 0;
        } catch (e) {
          hotel.calificacion = 0;
        }
      });

      mostrarHoteles(hoteles);

      const destacados = [...hoteles].sort((a, b) => b.calificacion - a.calificacion).slice(0, 5);
      renderCarrusel(destacados, "carrusel-destacados");

      const ofertas = [...hoteles].sort((a, b) => a.precio - b.precio).slice(0, 5);
      renderCarrusel(ofertas, "carrusel-ofertas");

      const aleatorios = hoteles.sort(() => 0.5 - Math.random()).slice(0, 5);
      renderCarrusel(aleatorios, "carrusel-experiencias");
    })
    .catch(error => console.error("Error al cargar hoteles:", error));
});

function verificarSesionYActualizarUI() {
  fetch("ver_sesion.php")
    .then(response => response.json())
    .then(data => {
      const authControls = document.getElementById("auth-controls");
      if (authControls) {
        authControls.innerHTML = data.autenticado
          ? `
            <span class="user-info">
              <i class="user-icon">👤</i> <span>Hola, ${data.nombre}</span>
            </span>
            <a href="logout.php" class="logout-btn">Cerrar sesión</a>
          `
          : `<a href="login.php" class="login-btn">Iniciar sesión</a>`;
      }
    })
    .catch(error => {
      console.error("Error al verificar sesión:", error);
      const authControls = document.getElementById("auth-controls");
      if (authControls) {
        authControls.innerHTML = `<a href="login.php" class="login-btn">Iniciar sesión</a>`;
      }
    });
}

function mostrarHoteles(hoteles) {
  const contenedor = document.getElementById("lista-hoteles");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  hoteles.forEach(hotel => {
    const div = document.createElement("div");
    div.classList.add("hotel");

    const tablaParam = modoMalActivo ? "&tabla=hoteles_del_mal" : "";

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

function filtrarHoteles() {
  const texto = document.getElementById("busqueda").value.toLowerCase();
  const pais = document.getElementById("filtro-pais").value;
  const precioMin = parseFloat(document.getElementById("precio-min").value) || 0;
  const precioMax = parseFloat(document.getElementById("precio-max").value) || Infinity;

  const resultados = todosLosHoteles.filter(hotel => {
    const coincideNombre = hotel.nombre.toLowerCase().includes(texto);
    const coincidePais = pais === "" || hotel.pais === pais;
    const coincidePrecio = hotel.precio >= precioMin && hotel.precio <= precioMax;
    return coincideNombre && coincidePais && coincidePrecio;
  });

  const seccion = document.getElementById("resultados");
  const contenedor = document.getElementById("lista-hoteles");
  contenedor.innerHTML = "";

  const tablaParam = modoMalActivo ? "&tabla=hoteles_del_mal" : "";

  if (resultados.length > 0) {
    seccion.style.display = "block";
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
    seccion.style.display = "block";
    contenedor.innerHTML = `<p style="text-align:center; color:#666;">No se encontraron hoteles que coincidan con la búsqueda.</p>`;
  }
}

function reiniciarFiltros() {
  document.getElementById("busqueda").value = "";
  document.getElementById("filtro-pais").value = "";
  document.getElementById("precio-min").value = "";
  document.getElementById("precio-max").value = "";
  document.getElementById("resultados").style.display = "none";
  filtrarHoteles();
}

function llenarFiltroPais(hoteles) {
  const paises = [...new Set(hoteles.map(h => h.pais))].sort();
  const select = document.getElementById("filtro-pais");
  paises.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });
}

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

function moverCarrusel(id, direccion) {
  const carrusel = document.getElementById("carrusel-" + id);
  const ancho = carrusel.querySelector(".hotel")?.offsetWidth || 300;
  carrusel.scrollBy({
    left: direccion * (ancho + 20),
    behavior: "smooth"
  });
}
