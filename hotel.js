document.addEventListener('DOMContentLoaded', () => {
    const hotelId = new URLSearchParams(window.location.search).get('id');
    const nombreHotelHeader = document.getElementById('nombre-hotel-header');
    const imagenHotel = document.getElementById('imagen-hotel');
    const descripcionHotel = document.getElementById('descripcion-hotel'); // This will hold the short description
    const descripcionDetallada = document.getElementById('descripcion-detallada'); // This will hold the detailed description
    const serviciosHotel = document.getElementById('servicios-hotel');
    const calificacionPromedioSpan = document.getElementById('calificacion-promedio');
    const totalReseñasSpan = document.getElementById('total-reseñas');
    const btnEscribirReseña = document.getElementById('btn-escribir-reseña');
    const listaReseñasDiv = document.getElementById('lista-reseñas');
    const authControls = document.getElementById('auth-controls');

    // Modal de reseña
    const modalReseña = document.getElementById('modal-reseña');
    const closeButtonReseña = modalReseña.querySelector('.close-button');
    const formReseña = document.getElementById('form-reseña');
    const comentarioReseña = document.getElementById('comentario-reseña');
    const mensajeModalReseña = document.getElementById('mensaje-modal-reseña');

    let usuarioLogueado = false;
    let idUsuario = null;
    let puedeEscribirReseña = false; // Variable para controlar el botón de reseña

    // --- 1. Cargar detalles del hotel y reseñas ---
    async function cargarDetallesHotelYReseñas() {
        if (!hotelId) {
            nombreHotelHeader.textContent = 'Hotel no encontrado';
            return;
        }

        try {
            const response = await fetch(`get_resenas_detallesH.php?id=${hotelId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                const hotel = data.hotel;
                nombreHotelHeader.textContent = hotel.nombre;
                imagenHotel.src = hotel.imagen_url || 'placeholder.jpg';
                descripcionHotel.textContent = hotel.descripcion_corta; // Set short description
                descripcionDetallada.textContent = hotel.descripcion_detallada; // Set detailed description

                serviciosHotel.innerHTML = '';
                if (hotel.servicios && hotel.servicios.length > 0) {
                    hotel.servicios.forEach(servicio => {
                        const li = document.createElement('li');
                        li.textContent = servicio;
                        serviciosHotel.appendChild(li);
                    });
                } else {
                    serviciosHotel.innerHTML = '<li>No hay servicios listados.</li>';
                }

                // Update the "Reservar este hotel" button's href
                const btnReservarHotel = document.getElementById("btn-reservar-hotel");
                if (btnReservarHotel) {
                    btnReservarHotel.href = `rooms.html?id_hotel=${hotelId}`;
                }

                // Cargar reseñas
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

    function mostrarReseñas(reviews) {
        listaReseñasDiv.innerHTML = '<h4>Reseñas de Usuarios:</h4>';
        if (reviews && reviews.length > 0) {
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
            const noReviews = document.createElement('p');
            noReviews.textContent = 'Sé el primero en dejar una reseña para este hotel.';
            listaReseñasDiv.appendChild(noReviews);
        }
    }

    function actualizarCalificacionPromedio(reviews) {
        if (reviews && reviews.length > 0) {
            const totalCalificaciones = reviews.reduce((sum, review) => sum + parseInt(review.calificacion), 0); // Ensure calificacion is treated as a number
            const promedio = (totalCalificaciones / reviews.length).toFixed(1);
            calificacionPromedioSpan.textContent = promedio;
            totalReseñasSpan.textContent = reviews.length;
        } else {
            calificacionPromedioSpan.textContent = 'N/A';
            totalReseñasSpan.textContent = '0';
        }
    }

    // --- 2. Verificar estado de sesión y reservas completadas ---
    async function verificarSesionYReservas() {
        try {
            const sessionResponse = await fetch('ver_sesion.php');
            const sessionData = await sessionResponse.json();

            if (sessionData.autenticado) {
                usuarioLogueado = true;
                idUsuario = sessionData.id_usuario;
                authControls.innerHTML = `
                    <span class="user-info"><i class="user-icon fas fa-user-circle"></i> ${sessionData.nombre}</span>
                    <a href="#" class="logout-btn" id="logout-btn">Cerrar Sesión</a>
                    <a href="mis_reservas.html" class="btn-ver-reservas">Ver Reservas</a>
                `;
                document.getElementById('logout-btn').addEventListener('click', cerrarSesion);

                // Fetch completed reservations for this hotel and user
                const reservasResponse = await fetch(`get_reservas.php?id_usuario=${idUsuario}&id_hotel=${hotelId}`);
                const reservasData = await reservasResponse.json();

                if (reservasData.success && reservasData.hasCompletedReservation) {
                    puedeEscribirReseña = true;
                    btnEscribirReseña.style.display = 'block';
                } else {
                    btnEscribirReseña.style.display = 'none';
                }

            } else {
                usuarioLogueado = false;
                idUsuario = null;
                authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>'; // Corrected: login.html to login.php
                btnEscribirReseña.style.display = 'none';
            }
        } catch (error) {
            console.error('Error al verificar sesión o reservas:', error);
            usuarioLogueado = false;
            idUsuario = null;
            authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>'; // Corrected: login.html to login.php
            btnEscribirReseña.style.display = 'none';
        }
    }

    // --- Funcionalidad del Modal de Reseña ---
    btnEscribirReseña.addEventListener('click', () => {
        if (usuarioLogueado && puedeEscribirReseña) {
            modalReseña.style.display = 'flex';
            formReseña.reset();
            mensajeModalReseña.style.display = 'none';
            mensajeModalReseña.className = 'modal-message';
        } else {
            alert('Debes haber completado una reserva en este hotel para poder escribir una reseña.');
        }
    });

    closeButtonReseña.addEventListener('click', () => {
        modalReseña.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modalReseña) {
            modalReseña.style.display = 'none';
        }
    });

    formReseña.addEventListener('submit', async (event) => {
        event.preventDefault();

        const calificacionElement = document.querySelector('input[name="calificacion"]:checked');
        const comentario = comentarioReseña.value.trim();

        if (!calificacionElement) {
            mostrarMensajeModal('Por favor, selecciona una calificación (entre 1 y 5 estrellas).', 'error');
            return;
        }

        const calificacion = parseInt(calificacionElement.value);

        if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
            mostrarMensajeModal('La calificación debe ser un número entre 1 y 5 estrellas.', 'error');
            return;
        }
        
        if (comentario.length < 10) { 
            mostrarMensajeModal('La reseña debe tener al menos 10 caracteres.', 'error');
            return;
        }

        const reseñaData = {
            id_hotel: hotelId,
            id_usuario: idUsuario,
            calificacion: calificacion,
            comentario: comentario
        };

        try {
            const response = await fetch('create_resena.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reseñaData)
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensajeModal('Reseña publicada con éxito!', 'info');
                formReseña.reset();
                cargarDetallesHotelYReseñas(); 
                setTimeout(() => {
                    modalReseña.style.display = 'none';
                }, 2000); 
            } else {
                mostrarMensajeModal(data.message, 'error');
            }
        } catch (error) {
            console.error('Error al enviar reseña:', error);
            mostrarMensajeModal('Error de conexión al publicar la reseña.', 'error');
        }
    });

    function mostrarMensajeModal(mensaje, tipo) {
        mensajeModalReseña.textContent = mensaje;
        mensajeModalReseña.className = `modal-message mensaje-${tipo}`;
        mensajeModalReseña.style.display = 'block';
    }

    // --- Funcionalidad de cierre de sesión ---
    async function cerrarSesion() {
        try {
            const response = await fetch('logout.php', { method: 'POST' });
            const data = await response.json(); // Assuming logout.php also returns JSON
            if (data.success) { // You need to ensure logout.php returns {success: true} or similar
                window.location.reload(); 
            } else {
                alert('Error al cerrar sesión.');
            }
        } catch (error) {
            console.error('Error de red al cerrar sesión:', error);
            alert('No se pudo conectar con el servidor para cerrar sesión.');
        }
    }
    
    // Initial calls
    cargarDetallesHotelYReseñas();
    verificarSesionYReservas();
});