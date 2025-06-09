<?php
session_start(); // Inicia la sesión para acceder a las variables de sesión.

// Devuelve una respuesta JSON que indica el estado de autenticación del usuario.
echo json_encode([
    // 'autenticado' es true si las variables de sesión 'usuario' e 'id_usuario' están seteadas.
    "autenticado" => isset($_SESSION['usuario']) && isset($_SESSION['id_usuario']),
    // 'nombre' del usuario, o null si no está seteado.
    "nombre" => $_SESSION['usuario'] ?? null,
    // 'id_usuario' del usuario, o null si no está seteado.
    "id_usuario" => $_SESSION['id_usuario'] ?? null
]);
?>