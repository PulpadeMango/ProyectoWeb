document.addEventListener('DOMContentLoaded', () => {
  fetch('get_reservas_usuarios.php', {
    method: "GET",
    credentials: "include" // Asegura que las cookies de sesión se envíen
  })
    .then(res => {
      // Siempre intentar parsear como JSON.
      // Si la respuesta no es OK (ej. 404, 500) o si no es JSON válido,
      // el .json() podría fallar o devolver un error que el .catch() manejará.
      // Aquí solo verificamos si la respuesta HTTP es exitosa.
      if (!res.ok) {
        // Podríamos lanzar un error aquí con más detalle del status
        // Por ejemplo, si el servidor devuelve un 401 por no autenticación,
        // aunque tu PHP devuelve 200 con un JSON de error para esa condición.
        // Aun así, es buena práctica mantener esta comprobación.
      }
      return res.json(); // Parsea la respuesta del servidor como JSON
    })
    .then(data => {
      // --- LÓGICA CLAVE PARA LA REDIRECCIÓN ---
      // Verificar si la respuesta es un objeto y si contiene la propiedad 'error'
      if (data && typeof data === 'object' && data.error) {
        console.warn("Mensaje de error del servidor:", data.error); // Útil para depuración
        if (data.error === "No has iniciado sesión.") {
          // Si el error es específicamente por no haber iniciado sesión,
          // redirigir al login.php. location.replace es preferible para limpiar el historial.
          window.location.replace('login.php');
          return; // Detener la ejecución de este bloque .then()
        } else {
          // Para otros errores reportados por el servidor (ej. conexión a DB fallida)
          const contenedor = document.getElementById("reservas-container");
          contenedor.innerHTML = `<p class="mensaje-error">Error al cargar tus reservas: ${data.error}</p>`;
        }
        return; // Detener la ejecución del .then() si ya se manejó un error
      }
      // --- FIN LÓGICA DE REDIRECCIÓN ---

      // Si llegamos aquí, 'data' debe ser un array de reservas (o un array vacío)
      const contenedor = document.getElementById("reservas-container");
      contenedor.innerHTML = ""; // Limpiar el mensaje de "Cargando reservas..."

      if (data.length === 0) {
        contenedor.innerHTML = "<p>No tienes reservas registradas.</p>";
        return; // Detener si no hay reservas para evitar el forEach
      }

      // Si hay reservas, proceder a renderizarlas
      data.forEach(reserva => {
        const fechaInicio = new Date(reserva.fecha_inicio);
        const fechaFin = new Date(reserva.fecha_fin);
        const diffTime = Math.abs(fechaFin - fechaInicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      console.error("Error en la solicitud de reservas:", error);
      // Este catch captura errores de red (ej. servidor no disponible)
      // o si la respuesta no es un JSON válido (ej. HTML de un error 500).
      document.getElementById("reservas-container").innerHTML =
        `<p class="mensaje-error">No se pudieron cargar tus reservas. Por favor, revisa tu conexión o inténtalo más tarde. (Detalle: ${error.message})</p>`;
    });

  // Asegúrate de que verificarSesionYActualizarUI se llama si existe
  if (typeof verificarSesionYActualizarUI === 'function') {
    verificarSesionYActualizarUI();
  }
});

// Las funciones getBotonesEstado, cambiarEstado y eliminarReserva se mantienen igual.
// Solo asegúrate de que están definidas en tu archivo mis_reservas.js o en un script.js que se carga antes.

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
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        const spanEstado = document.querySelector(`#estado-${id_reserva}`);
        if (spanEstado) {
            spanEstado.textContent = nuevo_estado;
            spanEstado.className = `estado-reserva estado-${nuevo_estado.toLowerCase()}`;
            location.reload();
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
        const cardToRemove = document.querySelector(`#reservas-container .hotel [onclick*="eliminarReserva(${id_reserva})"]`).closest('.hotel');
        if (cardToRemove) {
          cardToRemove.remove();
        }
        alert("Reserva eliminada correctamente.");
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