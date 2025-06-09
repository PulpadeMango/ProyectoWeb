document.addEventListener('DOMContentLoaded', () => {
    // Realiza una solicitud para obtener las reservas del usuario.
    fetch('get_reservas_usuarios.php', {
        method: "GET",
        credentials: "include" // Importante para enviar cookies de sesión.
    })
    .then(res => res.json())
    .then(data => {
        // Maneja errores específicos del servidor, como no haber iniciado sesión.
        if (data && typeof data === 'object' && data.error) {
            if (data.error === "No has iniciado sesión.") {
                window.location.replace('login.php'); // Redirige al login si no hay sesión.
            } else {
                document.getElementById("reservas-container").innerHTML = `<p class="mensaje-error">Error al cargar tus reservas: ${data.error}</p>`;
            }
            return;
        }

        const contenedor = document.getElementById("reservas-container");
        contenedor.innerHTML = ""; // Limpia el contenedor antes de añadir nuevas reservas.

        // Muestra un mensaje si no hay reservas o los datos no son un array.
        if (!Array.isArray(data) || data.length === 0) {
            contenedor.innerHTML = "<p>No tienes reservas registradas.</p>";
            return;
        }

        // Itera sobre cada reserva y crea una tarjeta para mostrarla.
        data.forEach(reserva => {
            // Calcula la duración de la reserva y el total a pagar.
            const fechaInicio = new Date(reserva.fecha_inicio);
            const fechaFin = new Date(reserva.fecha_fin);
            const diffDays = Math.ceil(Math.abs(fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
            const totalPagar = (reserva.precio_habitacion * diffDays).toFixed(2);

            const card = document.createElement("div");
            card.className = "hotel"; // Clase 'hotel' para el estilo de la tarjeta.
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
        // Maneja errores de red o de la solicitud Fetch.
        document.getElementById("reservas-container").innerHTML =
            `<p class="mensaje-error">No se pudieron cargar tus reservas. Revisa tu conexión o inténtalo más tarde. (${error.message})</p>`;
        console.error("Error en la solicitud de reservas:", error);
    });

    // Intenta ejecutar una función externa para actualizar la UI de sesión si existe.
    if (typeof verificarSesionYActualizarUI === 'function') {
        verificarSesionYActualizarUI();
    }
});

/**
 * Genera los botones de acción para una reserva según su estado actual.
 * @param {string} estado - El estado actual de la reserva ('Pendiente', 'Confirmada', 'Cancelada').
 * @param {number} id - El ID de la reserva.
 * @returns {string} HTML con los botones de acción.
 */
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

/**
 * Envía una solicitud al servidor para cambiar el estado de una reserva.
 * @param {number} id_reserva - El ID de la reserva a actualizar.
 * @param {string} nuevo_estado - El nuevo estado al que se cambiará la reserva.
 */
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
            // Actualiza visualmente el estado y recarga la página para refrescar botones.
            const spanEstado = document.querySelector(`#estado-${id_reserva}`);
            if (spanEstado) {
                spanEstado.textContent = nuevo_estado;
                spanEstado.className = `estado-reserva estado-${nuevo_estado.toLowerCase()}`;
                location.reload(); // Recargar para actualizar los botones de acción.
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

/**
 * Envía una solicitud al servidor para eliminar una reserva (solo si está cancelada).
 * Requiere confirmación del usuario.
 * @param {number} id_reserva - El ID de la reserva a eliminar.
 */
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
            // Elimina la tarjeta de la reserva del DOM.
            const cardToRemove = document.querySelector(`#reservas-container .hotel [onclick*="eliminarReserva(${id_reserva})"]`).closest('.hotel');
            if (cardToRemove) cardToRemove.remove();

            // Muestra mensaje si ya no quedan reservas.
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