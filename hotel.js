// Function to verify session and update UI (assuming it's in script.js or included globally)
// This function needs to be defined if it's not in a global script.js
// For this example, I'll assume it's loaded from script.js before hotel.js runs
// or if you prefer, copy it here:
/*
function verificarSesionYActualizarUI() {
    fetch("ver_sesion.php")
        .then(response => response.json())
        .then(data => {
            const authControls = document.getElementById("auth-controls");
            if (authControls) {
                if (data.autenticado) {
                    authControls.innerHTML = `
                        <span class="user-info">
                            <span class="user-icon">👤</span> Hola, ${data.nombre}
                        </span>
                        <a href="logout.php" class="logout-btn">Cerrar sesión</a>
                    `;
                } else {
                    authControls.innerHTML = `
                        <a href="login.php" class="login-btn">Iniciar sesión</a>
                    `;
                }
            }
        })
        .catch(error => console.error("Error al verificar sesión:", error));
}
*/

document.addEventListener('DOMContentLoaded', () => {
    // Call the session verification function if it's available
    if (typeof verificarSesionYActualizarUI === 'function') {
        verificarSesionYActualizarUI();
    } else {
        console.warn("verificarSesionYActualizarUI not found. Make sure script.js is loaded before hotel.js or its content is included.");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php") // Fetch todos los hoteles
        .then(response => {
            if (!response.ok) {
                // Check for HTTP errors (e.g., 404, 500)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(hoteles => {
            const hotel = hoteles.find(h => h.id == id); // Encuentra el hotel por ID

            if (!hotel) {
                // Handle if the hotel is not found
                document.getElementById("nombre-hotel").textContent = "Hotel no encontrado.";
                document.querySelector(".detalle-hotel").innerHTML = "<p class='mensaje-error'>El hotel que buscas no existe o ha sido eliminado.</p>";
                return;
            }

            // Display basic info
            document.getElementById("nombre-hotel").textContent = hotel.nombre;
            document.getElementById("imagen-hotel").src = hotel.imagen_url;
            document.getElementById("imagen-hotel").alt = `Imagen de ${hotel.nombre}`;
            document.getElementById("descripcion-detallada").textContent = hotel.descripcion;

            // Display detailed description (if exists)
            const descripcionDetalladaDiv = document.getElementById("descripcion-ampliada");
            if (hotel.descripcion_detallada) {
                descripcionDetalladaDiv.textContent = hotel.descripcion_detallada;
                descripcionDetalladaDiv.style.fontSize = "1.2em";
            } else {
                descripcionDetalladaDiv.textContent = "No hay descripción ampliada disponible.";
            }

            document.getElementById("ubicacion-hotel").textContent = `${hotel.ciudad}, ${hotel.pais}`;
            document.getElementById("precio-hotel").textContent = parseFloat(hotel.precio).toFixed(2); // Format price to 2 decimal places

            // --- Handle Services ---
            const serviciosDiv = document.getElementById("servicios-hotel");
            try {
                // Attempt to parse as JSON first, then fallback to split by comma
                const serviciosData = hotel.servicios || "[]";
                let servicios;
                if (serviciosData.startsWith('[') && serviciosData.endsWith(']')) {
                    servicios = JSON.parse(serviciosData);
                } else {
                    servicios = serviciosData.split(',').map(s => s.trim());
                }

                if (servicios.length > 0 && servicios[0] !== "") { // Check if not empty string after split
                    const serviciosHTML = servicios.map(s => `<li>${s}</li>`).join('');
                    serviciosDiv.innerHTML = `<ul>${serviciosHTML}</ul>`;
                } else {
                    serviciosDiv.textContent = "No hay servicios listados.";
                }
            } catch (e) {
                serviciosDiv.textContent = "Error al cargar servicios.";
                console.error("Error parsing services:", e);
            }

            // --- Handle Reviews ---
            const reseñasDiv = document.getElementById("reseñas");
            try {
                const reseñas = JSON.parse(hotel.reseñas || "[]").slice(0, 2); // Get up to 2 reviews
                if (reseñas.length > 0) {
                    const reseñasHTML = reseñas.map(r => `
                        <div class="reseña">
                            <p><strong>${r.nombre || 'Anónimo'}:</strong> ${r.texto || 'Sin comentario'} ⭐${r.estrellas || 'N/A'}</p>
                        </div>
                    `).join('');
                    reseñasDiv.innerHTML = reseñasHTML;
                } else {
                    reseñasDiv.textContent = "No hay reseñas disponibles.";
                }
            } catch (e) {
                reseñasDiv.textContent = "Error al cargar reseñas.";
                console.error("Error parsing reviews:", e);
            }

            // Logic for "Ver Habitaciones Disponibles" button
            const btnVerHabitaciones = document.getElementById("btn-ver-habitaciones");
            if (btnVerHabitaciones) {
                btnVerHabitaciones.href = `rooms.html?id_hotel=${hotel.id}`; // Correctly links to rooms.html with hotel ID
            }

        })
        .catch(error => {
            console.error("Error loading hotel details:", error);
            document.getElementById("nombre-hotel").textContent = "Error al cargar el hotel.";
            document.querySelector(".detalle-hotel").innerHTML = `<p class="mensaje-error">Ocurrió un error al cargar la información del hotel.<br>Por favor, intenta de nuevo más tarde.</p>`;
        });
});