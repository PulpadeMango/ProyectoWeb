<?php
session_start(); // Iniciar la sesión para poder destruirla.
session_unset(); // Elimina todas las variables de la sesión.
session_destroy(); // Destruye completamente la sesión activa.

// Redirigir al usuario a la página de inicio.
header("Location: index.html");
exit(); // Asegurar que el script se detenga después de la redirección.
?>