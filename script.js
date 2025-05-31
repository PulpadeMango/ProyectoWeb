fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php")
  .then(response => response.json())
  .then(hoteles => {
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
    <h3>${hotel.nombre}</h3>
    <p><strong>Ubicación:</strong> ${hotel.ciudad}, ${hotel.pais}</p>
    <p><strong>Precio:</strong> $${hotel.precio} USD</p>
    <p>${hotel.descripcion}</p>
  </a>
`;

      contenedor.appendChild(div);
    });
  })
  .catch(error => console.error("Error al cargar hoteles:", error));
