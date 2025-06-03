<?php
session_start();
session_unset(); // Elimina todas las variables de sesión
session_destroy(); // Destruye la sesión activa

// Redirigir a la página principal o login
header("Location: index.html");
exit();
