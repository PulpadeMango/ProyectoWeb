const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

fetch("https://hotelesresidenciadelbien.alwaysdata.net/get_data.php")
  .then(response => response.json())
  .then(hoteles => {
    const hotel = hoteles.find(h => h.id == id);
    if (!hotel) return;

    // Mostrar info básica
    document.getElementById("nombre-hotel").textContent = hotel.nombre;
    document.getElementById("imagen-hotel").src = hotel.imagen_url;
    document.getElementById("imagen-hotel").alt = `Imagen de ${hotel.nombre}`;
    document.getElementById("descripcion-detallada").textContent = hotel.descripcion;
    document.getElementById("ubicacion-hotel").textContent = `${hotel.ciudad}, ${hotel.pais}`;
    document.getElementById("precio-hotel").textContent = hotel.precio;

    const servicios = hotel.servicios?.split(',') || [];
    const serviciosHTML = servicios.map(s => `<li>${s.trim()}</li>`).join('');
    document.getElementById("servicios-hotel").innerHTML = `<ul>${serviciosHTML}</ul>`;
    
    const reseñas = JSON.parse(hotel.reseñas || "[]").slice(0, 2);
    const reseñasHTML = reseñas.map(r => `
      <div class="reseña">
        <p><strong>${r.nombre}:</strong> ${r.texto} ⭐${r.estrellas}</p>
      </div>
    `).join('');
    document.getElementById("reseñas").innerHTML = reseñasHTML;
  })
  .catch(error => console.error("Error al cargar detalles del hotel:", error));
