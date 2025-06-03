<?php
session_start();
echo json_encode([
  "autenticado" => isset($_SESSION['usuario']),
  "nombre" => $_SESSION['usuario'] ?? null
]);
