document.addEventListener('DOMContentLoaded', () => {
    // Obtiene parámetros de la URL para el ID del hotel y el tipo de tabla.
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('id');
    const tabla = params.get('tabla') || 'hoteles';

    // Referencias a elementos del DOM para actualizar el contenido del hotel.
    const nombreHotelHeader = document.getElementById('nombre-hotel-header');
    const imagenHotel = document.getElementById('imagen-hotel');
    const descripcionHotel = document.getElementById('descripcion-hotel');
    const descripcionDetallada = document.getElementById('descripcion-detallada');
    const serviciosHotel = document.getElementById('servicios-hotel');
    const calificacionPromedioSpan = document.getElementById('calificacion-promedio');
    const totalReseñasSpan = document.getElementById('total-reseñas');
    const btnEscribirReseña = document.getElementById('btn-escribir-reseña');
    const listaReseñasDiv = document.getElementById('lista-reseñas');
    const authControls = document.getElementById('auth-controls');
    const btnReservarHotel = document.getElementById("btn-reservar-hotel");

    // Referencias a elementos del DOM para el modal de reseñas.
    const modalReseña = document.getElementById('modal-reseña');
    const closeButtonReseña = modalReseña.querySelector('.close-button');
    const formReseña = document.getElementById('form-reseña');
    const comentarioReseña = document.getElementById('comentario-reseña');
    const mensajeModalReseña = document.getElementById('mensaje-modal-reseña');

    // Variables de estado para la sesión del usuario y permisos de reseña.
    let usuarioLogueado = false;
    let idUsuario = null;
    let puedeEscribirReseña = false;

    // Aplica estilos especiales si el hotel es de la tabla 'hoteles_del_mal'.
    if (tabla === 'hoteles_del_mal') {
        document.body.classList.add("modo-oscuro", "cambio-cursor");
        const titulo = document.getElementById("titulo-easter");
        if (titulo) titulo.textContent = "Resident Evil";
        if (btnReservarHotel) btnReservarHotel.style.display = "none";
    }

    /*Carga los detalles del hotel y sus reseñas desde el servidor.*/

    async function cargarDetallesHotelYReseñas() {
        if (!hotelId) {
            nombreHotelHeader.textContent = 'Hotel no encontrado';
            return;
        }

        try {
            const response = await fetch(`get_resenas_detallesH.php?id=${hotelId}&tabla=${tabla}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.success) {
                const hotel = data.hotel;
                nombreHotelHeader.textContent = hotel.nombre;
                imagenHotel.src = hotel.imagen_url || 'placeholder.jpg';
                descripcionHotel.textContent = hotel.descripcion_corta;
                descripcionDetallada.textContent = hotel.descripcion_detallada;

                // Muestra los servicios del hotel.
                serviciosHotel.innerHTML = '';
                if (hotel.servicios?.length > 0) {
                    hotel.servicios.forEach(servicio => {
                        const li = document.createElement('li');
                        li.textContent = servicio;
                        serviciosHotel.appendChild(li);
                    });
                } else {
                    serviciosHotel.innerHTML = '<li>No hay servicios listados.</li>';
                }

                // Actualiza el enlace de reservar hotel, si no es un hotel del "mal".
                if (btnReservarHotel && tabla !== 'hoteles_del_mal') {
                    btnReservarHotel.href = `rooms.html?id_hotel=${hotelId}&tabla=${tabla}`;
                }

                mostrarReseñas(data.reviews);
                actualizarCalificacionPromedio(data.reviews);
            } else {
                nombreHotelHeader.textContent = 'Error al cargar el hotel';
                console.error('Error al cargar detalles del hotel:', data.message);
            }
        } catch (error) {
            console.error('Error fetching hotel details:', error);
            nombreHotelHeader.textContent = 'Error de conexión';
        }
    }

    /**
     * Renderiza la lista de reseñas en la página.
     * @param {Array} reviews - Un array de objetos de reseñas.
     */
    function mostrarReseñas(reviews) {
        listaReseñasDiv.innerHTML = '<h4>Reseñas de Usuarios:</h4>';
        if (reviews?.length > 0) {
            reviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.classList.add('reseña-item');
                reviewItem.innerHTML = `
                    <p><strong>Calificación:</strong> <span class="calificacion">${'★'.repeat(review.calificacion)}${'☆'.repeat(5 - review.calificacion)}</span></p>
                    <p>${review.comentario}</p>
                    <p class="autor-fecha">Por: ${review.nombre_usuario} el ${new Date(review.fecha_reseña).toLocaleDateString()}</p>
                `;
                listaReseñasDiv.appendChild(reviewItem);
            });
        } else {
            listaReseñasDiv.innerHTML += '<p>Sé el primero en dejar una reseña para este hotel.</p>';
        }
    }

    /**
     * Calcula y actualiza la calificación promedio y el total de reseñas.
     * @param {Array} reviews - Un array de objetos de reseñas.
     */
    function actualizarCalificacionPromedio(reviews) {
        if (reviews?.length > 0) {
            const total = reviews.reduce((sum, r) => sum + parseInt(r.calificacion), 0);
            const promedio = (total / reviews.length).toFixed(1);
            calificacionPromedioSpan.textContent = promedio;
            totalReseñasSpan.textContent = reviews.length;
        } else {
            calificacionPromedioSpan.textContent = 'N/A';
            totalReseñasSpan.textContent = '0';
        }
    }

    /*Verifica el estado de la sesión del usuario y si tiene reservas completadas para este hotel.*/

    async function verificarSesionYReservas() {
        try {
            const res = await fetch('ver_sesion.php');
            const sesion = await res.json();

            if (sesion.autenticado) {
                usuarioLogueado = true;
                idUsuario = sesion.id_usuario;

                // Actualiza los controles de autenticación con el nombre del usuario y botón de cerrar sesión.
                authControls.innerHTML = `
                    <span class="user-info"><i class="user-icon fas fa-user-circle"></i> ${sesion.nombre}</span>
                    <a href="#" class="logout-btn" id="logout-btn">Cerrar Sesión</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', cerrarSesion);

                // Verifica si el usuario tiene una reserva completada para este hotel.
                const reservasRes = await fetch(`get_reservas.php?id_usuario=${idUsuario}&id_hotel=${hotelId}`);
                const reservasData = await reservasRes.json();

                puedeEscribirReseña = reservasData.success && reservasData.hasCompletedReservation;
                btnEscribirReseña.style.display = puedeEscribirReseña ? 'block' : 'none';
            } else {
                // Si el usuario no está autenticado, muestra el botón de iniciar sesión y oculta el de reseña.
                authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>';
                btnEscribirReseña.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al verificar sesión o reservas:', error);
            authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>';
            btnEscribirReseña.style.display = 'none';
        }
    }

    // Abre el modal de reseña cuando se hace clic en el botón "Escribir Reseña".
    btnEscribirReseña.addEventListener('click', () => {
        if (usuarioLogueado && puedeEscribirReseña) {
            modalReseña.style.display = 'flex';
            formReseña.reset(); // Limpiar el formulario al abrir.
            mensajeModalReseña.style.display = 'none';
            mensajeModalReseña.className = 'modal-message';
        } else {
            alert('Debes haber completado una reserva en este hotel para escribir una reseña.');
        }
    });

    // Cierra el modal de reseña al hacer clic en el botón de cerrar.
    closeButtonReseña.addEventListener('click', () => {
        modalReseña.style.display = 'none';
    });

    // Cierra el modal de reseña si se hace clic fuera de su contenido.
    window.addEventListener('click', e => {
        if (e.target == modalReseña) {
            modalReseña.style.display = 'none';
        }
    });

    // Maneja el envío del formulario de reseña.
    formReseña.addEventListener('submit', async e => {
        e.preventDefault();
        const calificacionEl = document.querySelector('input[name="calificacion"]:checked');
        const comentario = comentarioReseña.value.trim();

        if (!calificacionEl || comentario.length < 10) {
            mostrarMensajeModal('Debes seleccionar una calificación y escribir al menos 10 caracteres.', 'error');
            return;
        }

        const reseñaData = {
            id_hotel: hotelId,
            id_usuario: idUsuario,
            calificacion: parseInt(calificacionEl.value),
            comentario
        };

        try {
            const res = await fetch('create_resena.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reseñaData)
            });
            const data = await res.json();

            if (data.success) {
                mostrarMensajeModal('Reseña publicada con éxito!', 'info');
                formReseña.reset();
                cargarDetallesHotelYReseñas(); // Recargar reseñas para mostrar la nueva.
                setTimeout(() => {
                    modalReseña.style.display = 'none';
                }, 2000);
            } else {
                mostrarMensajeModal(data.message, 'error');
            }
        } catch (err) {
            console.error('Error al enviar reseña:', err);
            mostrarMensajeModal('Error de conexión al publicar la reseña.', 'error');
        }
    });

    /**
     * Muestra un mensaje dentro del modal de reseña.
       @param {string} mensaje - El texto del mensaje.
       @param {'info'|'error'} tipo - El tipo de mensaje para aplicar estilos.
     */
    function mostrarMensajeModal(mensaje, tipo) {
        mensajeModalReseña.textContent = mensaje;
        mensajeModalReseña.className = `modal-message mensaje-${tipo}`;
        mensajeModalReseña.style.display = 'block';
    }

    /*Cierra la sesión del usuario.*/
    
    async function cerrarSesion() {
        try {
            const res = await fetch('logout.php', { method: 'POST' });
            const data = await res.json();
            if (data.success) window.location.reload(); // Recargar la página al cerrar sesión.
            else alert('Error al cerrar sesión.');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
            alert('No se pudo conectar con el servidor para cerrar sesión.');
        }
    }

    // Ejecuta las funciones iniciales al cargar la página.
    cargarDetallesHotelYReseñas();
    verificarSesionYReservas();
});