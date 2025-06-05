const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php") // Fetch todos los hoteles
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(hoteles => {
    const hotel = hoteles.find(h => h.id == id); // Encuentra el hotel por ID
    
    if (!hotel) {
      // Manejo si el hotel no se encuentra
      document.getElementById("nombre-hotel").textContent = "Hotel no encontrado.";
      document.querySelector(".detalle-hotel").innerHTML = "<p style='text-align: center; margin-top: 20px; font-size: 1.2em; color: #d62828;'>El hotel que buscas no existe o ha sido eliminado.</p>";
      return;
    }

    // Mostrar info básica
    document.getElementById("nombre-hotel").textContent = hotel.nombre;
    document.getElementById("imagen-hotel").src = hotel.imagen_url;
    document.getElementById("imagen-hotel").alt = `Imagen de ${hotel.nombre}`;
    document.getElementById("descripcion-detallada").textContent = hotel.descripcion;
    document.getElementById("ubicacion-hotel").textContent = `${hotel.ciudad}, ${hotel.pais}`;
    document.getElementById("precio-hotel").textContent = hotel.precio;

    // --- Manejo de Servicios ---
    const serviciosDiv = document.getElementById("servicios-hotel");
    try {
        // Asumiendo que hotel.servicios es un string JSON como '["Wifi", "Piscina"]'
        // Si ya viene como un array (por ejemplo, en un entorno de desarrollo), quita JSON.parse
        const servicios = JSON.parse(hotel.servicios || "[]"); // Parsea a array, si no existe, usa un array vacío
        if (servicios.length > 0) {
            const serviciosHTML = servicios.map(s => `<li>${s.trim()}</li>`).join('');
            serviciosDiv.innerHTML = `<ul>${serviciosHTML}</ul>`;
        } else {
            serviciosDiv.textContent = "No hay servicios listados.";
        }
    } catch (e) {
        serviciosDiv.textContent = "Error al cargar servicios.";
        console.error("Error al parsear servicios:", e);
    }
    
    // --- Manejo de Reseñas ---
    const reseñasDiv = document.getElementById("reseñas");
    try {
        // Asumiendo que hotel.reseñas es un string JSON como '[{"nombre":"Usuario1","texto":"Buen hotel","estrellas":4}]'
        // Si ya viene como un array, quita JSON.parse
        const reseñas = JSON.parse(hotel.reseñas || "[]").slice(0, 2); // Parsea a array y toma las primeras 2
        if (reseñas.length > 0) {
            const reseñasHTML = reseñas.map(r => `
              <div class="reseña">
                <p><strong>${r.nombre}:</strong> ${r.texto} ⭐${r.estrellas}</p>
              </div>
            `).join('');
            reseñasDiv.innerHTML = reseñasHTML;
        } else {
            reseñasDiv.textContent = "No hay reseñas disponibles.";
        }
    } catch (e) {
        reseñasDiv.textContent = "Error al cargar reseñas.";
        console.error("Error al parsear reseñas:", e);
    }

    // Lógica para el botón de reservar (ejemplo)
    document.getElementById("btn-reservar").onclick = function() {
        alert(`¡Has intentado reservar ${hotel.nombre}! (Esta es una función de demostración)`);
    };

  })
  .catch(error => {
    console.error("Error al cargar detalles del hotel:", error);
    document.getElementById("nombre-hotel").textContent = "Error al cargar el hotel.";
    document.querySelector(".detalle-hotel").innerHTML = `<p style="text-align: center; margin-top: 20px; font-size: 1.2em; color: #d62828;">Ocurrió un error al cargar la información del hotel.<br>Por favor, intenta de nuevo más tarde.</p>`;
  });
