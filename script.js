let todosLosHoteles = [];

fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php")
  .then(response => response.json())
  .then(hoteles => {
    todosLosHoteles = hoteles;
    mostrarHoteles(hoteles);
  })
  .catch(error => console.error("Error al cargar hoteles:", error));

function mostrarHoteles(hoteles) {
  const contenedor = document.getElementById("lista-hoteles");
  contenedor.innerHTML = "";

  hoteles.forEach(hotel => {
    const div = document.createElement("div");
    div.classList.add("hotel");
    div.innerHTML = `
      <a href="hotel.html?id=${hotel.id}" class="enlace-hotel">
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
  const input = document.getElementById("busqueda");
  const filtro = input.value.toLowerCase();

  const filtrados = todosLosHoteles.filter(hotel =>
    hotel.nombre.toLowerCase().includes(filtro)
  );

  mostrarHoteles(filtrados);

  let mensajeNoEncontrado = document.getElementById("mensaje-no-encontrado");
  if (!mensajeNoEncontrado) {
    mensajeNoEncontrado = document.createElement("p");
    mensajeNoEncontrado.id = "mensaje-no-encontrado";
    mensajeNoEncontrado.style.textAlign = "center";
    mensajeNoEncontrado.style.marginTop = "20px";
    mensajeNoEncontrado.style.color = "#666";
    document.getElementById("lista-hoteles").after(mensajeNoEncontrado);
  }

  mensajeNoEncontrado.textContent = filtrados.length === 0 ? "No se encontraron hoteles." : "";
}