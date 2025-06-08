document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get('id');
  const tabla = params.get('tabla') || 'hoteles';

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

  const modalReseña = document.getElementById('modal-reseña');
  const closeButtonReseña = modalReseña.querySelector('.close-button');
  const formReseña = document.getElementById('form-reseña');
  const comentarioReseña = document.getElementById('comentario-reseña');
  const mensajeModalReseña = document.getElementById('mensaje-modal-reseña');

  let usuarioLogueado = false;
  let idUsuario = null;
  let puedeEscribirReseña = false;

  // Aplicar visual del modo malvado si corresponde
  if (tabla === 'hoteles_del_mal') {
    document.body.classList.add("modo-oscuro", "cambio-cursor");
    const titulo = document.getElementById("titulo-easter");
    if (titulo) titulo.textContent = "Resident Evil";
    if (btnReservarHotel) btnReservarHotel.style.display = "none";
  }

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

  async function verificarSesionYReservas() {
    try {
      const res = await fetch('ver_sesion.php');
      const sesion = await res.json();

      if (sesion.autenticado) {
        usuarioLogueado = true;
        idUsuario = sesion.id_usuario;

        authControls.innerHTML = `
          <span class="user-info"><i class="user-icon fas fa-user-circle"></i> ${sesion.nombre}</span>
          <a href="#" class="logout-btn" id="logout-btn">Cerrar Sesión</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', cerrarSesion);

        const reservasRes = await fetch(`get_reservas.php?id_usuario=${idUsuario}&id_hotel=${hotelId}`);
        const reservasData = await reservasRes.json();

        puedeEscribirReseña = reservasData.success && reservasData.hasCompletedReservation;
        btnEscribirReseña.style.display = puedeEscribirReseña ? 'block' : 'none';
      } else {
        authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>';
        btnEscribirReseña.style.display = 'none';
      }
    } catch (error) {
      console.error('Error al verificar sesión o reservas:', error);
      authControls.innerHTML = '<a href="login.php" class="login-btn">Iniciar Sesión</a>';
      btnEscribirReseña.style.display = 'none';
    }
  }

  btnEscribirReseña.addEventListener('click', () => {
    if (usuarioLogueado && puedeEscribirReseña) {
      modalReseña.style.display = 'flex';
      formReseña.reset();
      mensajeModalReseña.style.display = 'none';
      mensajeModalReseña.className = 'modal-message';
    } else {
      alert('Debes haber completado una reserva en este hotel para escribir una reseña.');
    }
  });

  closeButtonReseña.addEventListener('click', () => {
    modalReseña.style.display = 'none';
  });

  window.addEventListener('click', e => {
    if (e.target == modalReseña) {
      modalReseña.style.display = 'none';
    }
  });

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
        cargarDetallesHotelYReseñas();
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

  function mostrarMensajeModal(mensaje, tipo) {
    mensajeModalReseña.textContent = mensaje;
    mensajeModalReseña.className = `modal-message mensaje-${tipo}`;
    mensajeModalReseña.style.display = 'block';
  }

  async function cerrarSesion() {
    try {
      const res = await fetch('logout.php', { method: 'POST' });
      const data = await res.json();
      if (data.success) window.location.reload();
      else alert('Error al cerrar sesión.');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      alert('No se pudo conectar con el servidor para cerrar sesión.');
    }
  }

  cargarDetallesHotelYReseñas();
  verificarSesionYReservas();
});
