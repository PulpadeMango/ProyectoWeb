document.addEventListener('DOMContentLoaded', () => {
  // Verificar sesión si está definida
  if (typeof verificarSesionYActualizarUI === 'function') {
    verificarSesionYActualizarUI();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const tabla = urlParams.get("tabla") === "hoteles_del_mal" ? "hoteles_del_mal" : "hoteles";

  fetch(`https://hotelesresidenciadelbien.alwaysdata.net/get_data.php?tabla=${tabla}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(hoteles => {
      const hotel = hoteles.find(h => h.id == id);

      if (!hotel) {
        document.getElementById("nombre-hotel").textContent = "Hotel no encontrado.";
        document.querySelector(".detalle-hotel").innerHTML = "<p class='mensaje-error'>El hotel que buscas no existe o ha sido eliminado.</p>";
        return;
      }

      // Mostrar información básica
      document.getElementById("nombre-hotel").textContent = hotel.nombre;
      document.getElementById("imagen-hotel").src = hotel.imagen_url;
      document.getElementById("imagen-hotel").alt = `Imagen de ${hotel.nombre}`;
      document.getElementById("descripcion-detallada").textContent = hotel.descripcion;

      // Descripción detallada
      const descripcionDetalladaDiv = document.getElementById("descripcion-ampliada");
      if (hotel.descripcion_detallada) {
        descripcionDetalladaDiv.textContent = hotel.descripcion_detallada;
        descripcionDetalladaDiv.style.fontSize = "1.2em";
      } else {
        descripcionDetalladaDiv.textContent = "No hay descripción ampliada disponible.";
      }

      document.getElementById("ubicacion-hotel").textContent = `${hotel.ciudad}, ${hotel.pais}`;
      document.getElementById("precio-hotel").textContent = parseFloat(hotel.precio).toFixed(2);

      // Servicios
      const serviciosDiv = document.getElementById("servicios-hotel");
      try {
        const serviciosData = hotel.servicios || "[]";
        let servicios;
        if (serviciosData.startsWith("[") && serviciosData.endsWith("]")) {
          servicios = JSON.parse(serviciosData);
        } else {
          servicios = serviciosData.split(',').map(s => s.trim());
        }

        if (servicios.length > 0 && servicios[0] !== "") {
          serviciosDiv.innerHTML = `<ul>${servicios.map(s => `<li>${s}</li>`).join('')}</ul>`;
        } else {
          serviciosDiv.textContent = "No hay servicios listados.";
        }
      } catch (e) {
        serviciosDiv.textContent = "Error al cargar servicios.";
        console.error("Error parsing services:", e);
      }

      // Reseñas
      const reseñasDiv = document.getElementById("reseñas");
      try {
        const reseñas = JSON.parse(hotel.reseñas || "[]").slice(0, 2);
        if (reseñas.length > 0) {
          reseñasDiv.innerHTML = reseñas.map(r => `
            <div class="reseña">
              <p><strong>${r.nombre || 'Anónimo'}:</strong> ${r.texto || 'Sin comentario'} ⭐${r.estrellas || 'N/A'}</p>
            </div>
          `).join('');
        } else {
          reseñasDiv.textContent = "No hay reseñas disponibles.";
        }
      } catch (e) {
        reseñasDiv.textContent = "Error al cargar reseñas.";
        console.error("Error parsing reviews:", e);
      }

      // Botón a habitaciones si aplica
      const btnVerHabitaciones = document.getElementById("btn-ver-habitaciones");
      if (btnVerHabitaciones) {
        btnVerHabitaciones.href = `rooms.html?id_hotel=${hotel.id}`;
      }
    })
    .catch(error => {
      console.error("Error loading hotel details:", error);
      document.getElementById("nombre-hotel").textContent = "Error al cargar el hotel.";
      document.querySelector(".detalle-hotel").innerHTML = `
        <p class="mensaje-error">
          Ocurrió un error al cargar la información del hotel.<br>Por favor, intenta de nuevo más tarde.
        </p>`;
    });
});
