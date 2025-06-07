document.addEventListener('DOMContentLoaded', () => {
  fetch('get_reservas_usuarios.php', {
    method: "GET",
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const contenedor = document.getElementById("reservas-container");
      contenedor.innerHTML = "";

      if (data.length === 0) {
        contenedor.innerHTML = "<p>No tienes reservas registradas.</p>";
        return;
      }

      data.forEach(reserva => {
        // Calcular el número de noches
        const fechaInicio = new Date(reserva.fecha_inicio);
        const fechaFin = new Date(reserva.fecha_fin);
        const diffTime = Math.abs(fechaFin - fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalPagar = (reserva.precio_habitacion * diffDays).toFixed(2); // Formatear a 2 decimales

        const card = document.createElement("div");
        card.className = "hotel"; // Mantener la clase "hotel" para el estilo general de tarjeta

        card.innerHTML = `
          ${reserva.imagen_hotel ? `<div class="imagen-reserva"><img src="${reserva.imagen_hotel}" alt="Imagen del Hotel ${reserva.nombre_hotel}"></div>` : ''}
          <div class="info-reserva">
            <h3>Hotel: ${reserva.nombre_hotel || "Hotel desconocido"}</h3>
            <p><strong>Habitación:</strong> ${reserva.numero_habitacion} (${reserva.tipo_habitacion})</p>
            <p><strong>Fechas:</strong> ${reserva.fecha_inicio} a ${reserva.fecha_fin}</p>
            <p><strong>Precio por noche:</strong> $${parseFloat(reserva.precio_habitacion).toFixed(2)} USD</p>
            <p><strong>Noches:</strong> ${diffDays}</p>
            <p><strong>Total a pagar:</strong> <span class="total-pago">$${totalPagar} USD</span></p>
            <p><strong>Estado:</strong>
              <span id="estado-${reserva.id_reserva}" class="estado-reserva estado-${reserva.estado.toLowerCase()}">
                ${reserva.estado}
              </span>
            </p>
            <div class="acciones-reserva">
              ${getBotonesEstado(reserva.estado, reserva.id_reserva)}
            </div>
          </div>
        `;
        contenedor.appendChild(card);
      });
    })
    .catch(error => {
      console.error("Error al cargar las reservas:", error);
      document.getElementById("reservas-container").innerHTML = `<p class='mensaje-error'>Error al cargar tus reservas: ${error.message}. Por favor, inténtalo de nuevo más tarde.</p>`;
    });

  // Asegúrate de que verificarSesionYActualizarUI se llama si existe
  if (typeof verificarSesionYActualizarUI === 'function') {
    verificarSesionYActualizarUI();
  }
});


function getBotonesEstado(estado, id) {
  let botones = [];
  // Asegúrate de usar las clases CSS que definirás en styles.css
  if (estado === "Pendiente") {
    botones.push(`<button class="btn-accion btn-confirmar" onclick="cambiarEstado(${id}, 'Confirmada')">Confirmar</button>`);
    botones.push(`<button class="btn-accion btn-cancelar" onclick="cambiarEstado(${id}, 'Cancelada')">Cancelar</button>`);
  } else if (estado === "Confirmada") {
    botones.push(`<button class="btn-accion btn-completar" onclick="cambiarEstado(${id}, 'Completada')">Marcar como Completada</button>`);
    botones.push(`<button class="btn-accion btn-cancelar" onclick="cambiarEstado(${id}, 'Cancelada')">Cancelar</button>`);
  } else if (estado === "Cancelada") {
    botones.push(`<button class="btn-accion btn-eliminar" onclick="eliminarReserva(${id})">Eliminar</button>`);
  }
  // Para "Completada" no se añaden botones por defecto, puedes añadir si hay alguna acción post-completado.

  return botones.join(" ");
}

// Las funciones cambiarEstado y eliminarReserva se mantienen igual
function cambiarEstado(id_reserva, nuevo_estado) {
  fetch('update_estado_reservas.php', { // Corregido el nombre del archivo si era 'actualizar_estado_reserva.php'
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: "include",
    body: JSON.stringify({ id_reserva, estado: nuevo_estado }) // Cambiado 'nuevo_estado' a 'estado' para que coincida con el PHP
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        const spanEstado = document.querySelector(`#estado-${id_reserva}`);
        if (spanEstado) { // Verificar si el elemento existe antes de manipularlo
            spanEstado.textContent = nuevo_estado;
            spanEstado.className = `estado-reserva estado-${nuevo_estado.toLowerCase()}`;
            // Recargar la lista de reservas para actualizar los botones
            // Esto es una forma simple, pero puede ser más eficiente actualizar solo la tarjeta
            location.reload(); // Recargar la página para ver los cambios
        }
        alert('Estado actualizado correctamente.');
      } else {
        alert(data.message || 'No se pudo actualizar el estado.');
      }
    })
    .catch(error => {
      console.error("Error al actualizar estado:", error);
      alert(`Error al actualizar el estado: ${error.message}`);
    });
}

function eliminarReserva(id_reserva) {
  if (!confirm("¿Estás seguro de eliminar esta reserva cancelada?")) return;

  fetch('eliminar_reserva.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: "include",
    body: JSON.stringify({ id_reserva })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        // Eliminar la tarjeta de la reserva del DOM
        const cardToRemove = document.querySelector(`#reservas-container .hotel [onclick*="eliminarReserva(${id_reserva})"]`).closest('.hotel');
        if (cardToRemove) {
          cardToRemove.remove();
        }
        alert("Reserva eliminada correctamente.");
        // Si no quedan reservas, mostrar el mensaje de "No tienes reservas"
        const contenedor = document.getElementById("reservas-container");
        if (contenedor.children.length === 0) {
            contenedor.innerHTML = "<p>No tienes reservas registradas.</p>";
        }
      } else {
        alert(data.message || "No se pudo eliminar la reserva.");
      }
    })
    .catch(error => {
      console.error("Error al eliminar reserva:", error);
      alert(`Error al eliminar la reserva: ${error.message}`);
    });
}