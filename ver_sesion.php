<?php
session_start();

echo json_encode([
  "autenticado" => isset($_SESSION['usuario']) && isset($_SESSION['id_usuario']),
  "nombre" => $_SESSION['usuario'] ?? null,
  "id_usuario" => $_SESSION['id_usuario'] ?? null
]);
