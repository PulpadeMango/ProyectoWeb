document.addEventListener('DOMContentLoaded', () => {
  fetch('get_reservas_usuarios.php', {
    method: "GET",
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    if (data && typeof data === 'object' && data.error) {
      if (data.error === "No has iniciado sesión.") {
        window.location.replace('login.php');
      } else {
        document.getElementById("reservas-container").innerHTML = `<p class="mensaje-error">Error al cargar tus reservas: ${data.error}</p>`;
      }
      return;
    }

    const contenedor = document.getElementById("reservas-container");
    contenedor.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      contenedor.innerHTML = "<p>No tienes reservas registradas.</p>";
      return;
    }

    data.forEach(reserva => {
      const fechaInicio = new Date(reserva.fecha_inicio);
      const fechaFin = new Date(reserva.fecha_fin);
      const diffDays = Math.ceil(Math.abs(fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
      const totalPagar = (reserva.precio_habitacion * diffDays).toFixed(2);

      const card = document.createElement("div");
      card.className = "hotel";
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
    document.getElementById("reservas-container").innerHTML =
      `<p class="mensaje-error">No se pudieron cargar tus reservas. Revisa tu conexión o inténtalo más tarde. (${error.message})</p>`;
    console.error("Error en la solicitud de reservas:", error);
  });

  if (typeof verificarSesionYActualizarUI === 'function') {
    verificarSesionYActualizarUI();
  }
});

function getBotonesEstado(estado, id) {
  let botones = [];
  if (estado === "Pendiente") {
    botones.push(`<button class="btn-accion btn-confirmar" onclick="cambiarEstado(${id}, 'Confirmada')">Confirmar</button>`);
    botones.push(`<button class="btn-accion btn-cancelar" onclick="cambiarEstado(${id}, 'Cancelada')">Cancelar</button>`);
  } else if (estado === "Confirmada") {
    botones.push(`<button class="btn-accion btn-completar" onclick="cambiarEstado(${id}, 'Completada')">Marcar como Completada</button>`);
    botones.push(`<button class="btn-accion btn-cancelar" onclick="cambiarEstado(${id}, 'Cancelada')">Cancelar</button>`);
  } else if (estado === "Cancelada") {
    botones.push(`<button class="btn-accion btn-eliminar" onclick="eliminarReserva(${id})">Eliminar</button>`);
  }
  return botones.join(" ");
}

function cambiarEstado(id_reserva, nuevo_estado) {
  fetch('update_estado_reservas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: "include",
    body: JSON.stringify({ id_reserva, estado: nuevo_estado })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const spanEstado = document.querySelector(`#estado-${id_reserva}`);
      if (spanEstado) {
        spanEstado.textContent = nuevo_estado;
        spanEstado.className = `estado-reserva estado-${nuevo_estado.toLowerCase()}`;
        location.reload();
      }
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
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const cardToRemove = document.querySelector(`#reservas-container .hotel [onclick*="eliminarReserva(${id_reserva})"]`).closest('.hotel');
      if (cardToRemove) cardToRemove.remove();

      if (document.getElementById("reservas-container").children.length === 0) {
        document.getElementById("reservas-container").innerHTML = "<p>No tienes reservas registradas.</p>";
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
